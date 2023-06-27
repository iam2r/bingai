import { ref } from "vue";
import { defineStore } from "pinia";
import { sydneyConfigs as sydneyConfigsCommon } from "@/utils/config";

export interface SydneyConfig {
  baseUrl: string;
  label: string;
  isUsable?: boolean;
  delay?: number;
  isCus?: boolean;
}

export interface CheckSydneyConfigResult {
  isUsable: boolean;
  errorMsg?: string;
  delay?: number;
}

export const useChatStore = defineStore(
  "chat-store",
  () => {
    const chatHubPath = "/sydney/ChatHub";
    const isShowChatServiceSelectModal = ref(false);
    const selectedSydneyBaseUrl = ref("");
    const createDefaultSydneyConfigs = () => [
      {
        baseUrl: "https://sydney.bing.com",
        label: "Bing 官方",
      },
      ...sydneyConfigsCommon,
      {
        baseUrl: "",
        label: "自定义",
        isCus: true,
      },
    ];
    const sydneyConfigs = ref<SydneyConfig[]>(createDefaultSydneyConfigs());
    const sydneyCheckTimeoutMS = 3000;

    const checkSydneyConfig = async (
      config: SydneyConfig
    ): Promise<CheckSydneyConfigResult> => {
      if (!config.baseUrl) {
        return {
          isUsable: false,
          errorMsg: "链接不可为空",
        };
      }
      try {
        const startTime = Date.now();
        const ws = new WebSocket(
          config.baseUrl.replace("http", "ws") + chatHubPath
        );
        const wsTimer = setTimeout(() => {
          ws.close();
        }, sydneyCheckTimeoutMS);
        await new Promise((resolve, reject) => {
          ws.onopen = () => {
            clearTimeout(wsTimer);
            resolve(ws.close());
          };
          ws.onerror = () => {
            clearTimeout(wsTimer);
            reject(new Error(`聊天服务器 ${config.baseUrl} 连接失败`));
          };
          ws.onclose = () =>
            reject(new Error(`聊天服务器 ${config.baseUrl} 连接超时`));
        });
        return {
          isUsable: true,
          delay: Date.now() - startTime,
        };
      } catch (error) {
        return {
          isUsable: false,
          errorMsg: error instanceof Error ? error.message : "",
        };
      }
    };

    const checkAllSydneyConfig = async () => {
      const checkAllConfigPromises = sydneyConfigs.value
        .filter((x) => x.baseUrl)
        .map(async (config) => {
          const checkResult = await checkSydneyConfig(config);
          config.isUsable = checkResult.isUsable;
          config.delay = checkResult.delay;
          return config;
        });
      return await Promise.all(checkAllConfigPromises);
    };

    const resetSydneyConfigs = async () => {
      sydneyConfigs.value = createDefaultSydneyConfigs();
      const configs = await checkAllSydneyConfig();
      const config =
        configs.find((it) => it.isUsable) ||
        configs.find((it) => it.label === "Cloudflare") ||
        configs[0];
      selectedSydneyBaseUrl.value = config.baseUrl;
      CIB.config.sydney.baseUrl = config.baseUrl;
    };

    return {
      isShowChatServiceSelectModal,
      sydneyConfigs,
      selectedSydneyBaseUrl,
      checkSydneyConfig,
      checkAllSydneyConfig,
      resetSydneyConfigs,
    };
  },
  {
    persist: {
      key: "chat-store",
      storage: localStorage,
      paths: ["selectedSydneyBaseUrl", "sydneyConfigs"],
    },
  }
);
