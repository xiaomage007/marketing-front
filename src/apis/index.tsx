// 请求地址
const apiHostUrl = process.env.API_HOST_URL ? process.env.API_HOST_URL : "https://m1.apifoxmock.com/m1/8044424-7799459-default";

/**
 * 装配抽奖
 * @param activityId 活动Id
 */
export const activityStrategyArmory = (activityId?: number) => {
    return fetch(`${apiHostUrl}/api/v1/raffle/activity/armory?activityId=${activityId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

/**
 * 查询抽奖奖品列表
 * @param userId 用户Id
 * @param activityId 活动Id
 * @returns 
 */
export const queryRaffleAwardList = (userId?: string, activityId?: number) => {
    try {
        return fetch(`${apiHostUrl}/api/v1/raffle/strategy/query_raffle_award_list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                userId: userId,
                activityId: activityId
            })
        });
    } catch (error) {
        return fetch("{\n" +
            "    \"code\": \"0001\",\n" +
            "    \"info\": \"调用失败\",\n" +
            "    \"data\": [\n" +
            "}");
    }
}

/**
 * 抽奖接口
 * @param userId 用户Id
 * @param activityId 活动Id
 * @returns 
 */
export const draw = (userId?: string, activityId?: number) => {
    try {
        return fetch(`${apiHostUrl}/api/v1/raffle/activity/draw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json:charset=utf-8'
            },
            body: JSON.stringify({
                userId: userId,
                activityId: activityId
            })
        })
    } catch (error) {
        return fetch("{\n" +
            "    \"code\": \"0001\",\n" +
            "    \"info\": \"调用失败\",\n" +
            "    \"data\": [\n" +
            "}");
    }
}