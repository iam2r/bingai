import type { ApiResult } from "./model/ApiResult";
import type { SysConfig } from "./model/sysconf/SysConfig";
import { sydneyConfigs } from "@/utils/config";
const baseUrls = sydneyConfigs.map((it) => it.baseUrl);
export async function getSysConfig(baseUrl = baseUrls[0]) {
  const url = baseUrl + "/sysconf";
  return fetch(url, {
    credentials: "include",
  })
    .then((res) => res.json() as unknown as ApiResult<SysConfig>)
    .catch(() => {
      const next = baseUrls.findIndex((it) => it === baseUrl) + 1;
      if (baseUrls[next]) {
        return getSysConfig(baseUrls[next]);
      }else{
        return Promise.reject()
      }
    });
}

const sysConfApi = {
  getSysConfig,
};

export default sysConfApi;
