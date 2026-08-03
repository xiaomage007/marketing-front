"use client"
// 声明本组件为客户端组件，因为抽奖转盘涉及浏览器 DOM 操作与事件绑定，需要在客户端渲染

import React, { useEffect, useState, useRef } from 'react'
// 引入 React 核心 API：useEffect 用于副作用处理（如首次加载请求接口）、useState 用于组件内部状态管理、useRef 用于获取转盘组件实例引用
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { LuckyWheel } from '@lucky-canvas/react'
// 引入 @lucky-canvas/react 第三方抽奖转盘组件；该库未提供完善的 TS 类型声明，因此忽略类型校验

import { queryRaffleAwardList, randomRaffle } from "@/apis";
// 引入接口请求方法：queryRaffleAwardList 用于查询奖品列表，randomRaffle 用于执行随机抽奖
import { RaffleAwardVO } from "@/types/RaffleAwardVO"
// 引入奖品数据 VO 类型定义，用于规范接口返回数据结构

/**
 * 抽奖转盘页面组件
 * 功能说明：
 *   1. 从 URL 参数中读取 strategyId（抽奖策略 ID），用于调用对应接口
 *   2. 页面加载时自动请求奖品列表并渲染到转盘上
 *   3. 用户点击中心按钮后触发抽奖动画，2.5 秒后请求后端抽奖接口并停在中奖位置
 *   4. 抽奖结束后通过 onEnd 回调弹窗提示中奖信息
 */
export function LuckyWheelPage() {
    // ============== URL 参数解析 ==============
    // 获取当前页面 URL 中的查询参数对象，例如 ?strategyId=100001
    const queryParams = new URLSearchParams(window.location.search);
    // 从查询参数中获取 strategyId（抽奖策略 ID），并转换为数字类型；后续接口调用都会用到
    const strategyId = Number(queryParams.get('strategyId'));

    // ============== 状态定义 ==============
    // 奖品列表状态：初始值为 [{}] 占位对象；通过 queryRaffleAwardListHandle 请求接口后填充真实奖品数据
    const [prizes, setPrizes] = useState([{}])
    // 转盘组件实例引用：通过 useRef 保存 LuckyWheel 组件实例，便于调用其 play() 开始旋转、stop() 停止旋转等方法
    const myLucky = useRef()

    // ============== 转盘外框（blocks）配置 ==============
    // blocks 表示转盘外层的装饰块；这里设置内边距、背景色以及装饰图片（这里是虫洞侠 logo）
    const [blocks] = useState([
        { padding: '10px', background: '#869cfa', imgs: [{ src: "https://bugstack.cn/images/system/blog-03.png" }] }
    ])

    // ============== 转盘按钮（buttons）配置 ==============
    // buttons 是转盘中心的按钮区域，由三层同心圆组成：
    //   第 1 层：最外圈，半径 40%，深色背景
    //   第 2 层：中间层，半径 35%，浅色背景
    //   第 3 层：最内层，半径 30%，并标记 pointer: true 表示这是可点击触发抽奖的按钮，按钮文字为「开始」
    const [buttons] = useState([
        { radius: '40%', background: '#617df2' },
        { radius: '35%', background: '#afc8ff' },
        {
            radius: '30%', background: '#869cfa',
            pointer: true,
            fonts: [{ text: '开始', top: '-10px' }]
        }
    ])

    /**
     * 查询抽奖奖品列表
     * 逻辑步骤：
     *   1. 调用 queryRaffleAwardList 接口，传入 strategyId 获取奖品列表数据
     *   2. 解析接口返回结果（code 为业务码、info 为提示信息、data 为业务数据）
     *   3. 如果 code 不是 "0000"（业务失败码），弹出错误提示并直接返回
     *   4. 遍历奖品列表，将奖品数据转换为转盘所需的 prizes 数据结构：
     *      - 奇偶索引交替设置不同的背景色，使转盘扇区颜色分明
     *      - 将奖品的 awardId 与 awardTitle 绑定到扇区字体上，便于后续中奖时识别
     *   5. 调用 setPrizes 更新组件状态，触发转盘重新渲染
     */
    const queryRaffleAwardListHandle = async () => {
        // 调用接口获取奖品列表
        const result = await queryRaffleAwardList(strategyId);
        // 解析接口响应，提取业务码、提示信息和业务数据
        const { code, info, data } = await result.json();
        // 判断业务码：非 "0000" 视为失败，弹出提示并中断后续流程
        if (code != "0000") {
            window.alert("获取抽奖奖品列表失败 code:" + code + " info:" + info)
            return;
        }

        // 将奖品数据转换为转盘所需的 prizes 结构
        // 使用奇偶索引交替背景色：偶数索引为浅色，奇数索引为深色，形成对比明显的扇区
        const prizes = data.map((award: RaffleAwardVO, index: number) => {
            const background = index % 2 === 0 ? '#e9e8fe' : '#b8c5f2';
            return {
                background: background,
                // fonts 数组用于在扇区上显示文字：id 保存 awardId（用于中奖后定位），text 显示奖品名称，top 调整文字纵向偏移
                fonts: [{ id: award.awardId, text: award.awardTitle, top: '15px' }]
            };
        });
        // 更新奖品列表状态，触发组件重新渲染
        setPrizes(prizes);
    }

    /**
     * 调用随机抽奖接口
     * 逻辑步骤：
     *   1. 调用 randomRaffle 接口，传入 strategyId 执行一次随机抽奖
     *   2. 解析接口返回：code 业务码、info 提示信息、data 业务数据（含 awardIndex 或 awardId）
     *   3. 如果业务失败，弹窗提示并返回
     *   4. 计算中奖索引：
     *      - 如果接口直接返回 awardIndex（mock 接口场景），则直接使用
     *      - 否则根据 awardId 在 prizes 列表中查找匹配项的索引，并 +1
     *      （+1 是因为 LuckyWheel 的索引从 1 开始，而数组 findIndex 从 0 开始）
     *   5. 返回中奖索引，供转盘 stop() 方法使用
     */
    const randomRaffleHandle = async () => {
        // 调用后端随机抽奖接口
        const result = await randomRaffle(strategyId);
        // 解析接口响应
        const { code, info, data } = await result.json();
        // 业务失败处理
        if (code != "0000") {
            window.alert("获取抽奖奖品列表失败 code:" + code + " info:" + info)
            return;
        }
        // 为了方便测试，mock 的接口直接返回 awardIndex 也就是奖品列表中第几个奖品。
        // 优先使用接口返回的 awardIndex；若未返回，则根据 awardId 在 prizes 中查找对应索引
        return data.awardIndex ? data.awardIndex : prizes.findIndex(prize =>
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            // 通过比较奖品扇区字体的 id 与返回的 awardId 来定位中奖项
            prize.fonts.some(font => font.id === data.awardId)
        ) + 1;
    }

    /**
     * 组件挂载副作用
     * 仅在组件首次挂载时执行一次（依赖数组为空 []），用于请求奖品列表数据
     */
    useEffect(() => {
        // 加载奖品列表；then 中的回调无实际逻辑（r 参数未使用）
        // eslint-disable-next-line react-hooks/set-state-in-effect
        queryRaffleAwardListHandle().then(r => {
        });
    }, [])

    // ============== JSX 渲染 ==============
    return <div>
        {/* LuckyWheel 转盘组件 */}
        <LuckyWheel
            ref={myLucky}                   // 绑定组件实例引用，便于通过 myLucky.current 调用组件方法
            width="300px"                   // 转盘宽度
            height="300px"                  // 转盘高度
            blocks={blocks}                 // 注入外框装饰配置
            prizes={prizes}                 // 注入奖品列表数据（来自接口）
            buttons={buttons}               // 注入中心按钮配置
            onStart={() => {                // 点击抽奖按钮时会触发 start 回调
                // 调用转盘组件的 play() 方法启动旋转动画（TS 未声明该方法，故忽略类型校验）
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                myLucky.current.play()
                // 设置 2500ms（2.5 秒）后停止旋转，与动画旋转时长匹配，营造抽奖效果
                setTimeout(() => {
                    // 2.5 秒后调用随机抽奖接口，拿到中奖索引
                    randomRaffleHandle().then(prizeIndex => {
                        // 调用转盘组件的 stop() 方法停在指定索引位置（即中奖位置）
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        myLucky.current.stop(prizeIndex);
                    }
                    );

                }, 2500)
            }}
            onEnd={
                // 转盘停止旋转后触发的 end 回调，参数 prize 即为中奖扇区对象
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                prize => {
                    // 弹窗展示中奖信息：包含奖品名称（prize.fonts[0].text）和奖品 ID（prize.fonts[0].id）
                    alert('恭喜你抽到【' + prize.fonts[0].text + '】奖品ID【' + prize.fonts[0].id + '】')
                }
            }
        />
    </div>
}