# 金弧裂爪 · 黑甲雷袭

30 秒黑金猫科英雄动作短片。单文件 HTML 无按钮、文字叠层或播放控件；
人物、场景、动作、金白电弧、火花、残影和声音均随文件交付，无运行时网络依赖。

[Creation journey](creation-journey.md) records the initial 3D attempt, the 2.5D
pivot, export adjustments and the gap against the original brief.

- [播放源文件](film.html)：1280 × 720，16:9，900 个确定性帧，30fps。
- [完整 GIF](golden-claw.gif)：512 × 288，900 帧，30 秒，无声，循环播放。
- [带音效 MP4](golden-claw.mp4)：960 × 540，恒定 30fps，30 秒，H.264/AAC。
- [开场近景](opening.jpg)与[战斗画面](action.jpg)：同一交付的实际渲染帧。

![开场：棕褐毛发、冷峻眼神、黑金装甲](opening.jpg)

![战斗：低位切入、金弧裂爪、受击反应](action.jpg)

## 动作与声音

| 时间     | 表现                                       |
| -------- | ------------------------------------------ |
| 00–04 秒 | 贴脸锁敌、首秒电弧爪击、拉远后低位切入     |
| 04–08 秒 | 低头闪避、肘击、空中爪击、墙面反扑         |
| 08–12 秒 | 电弧擦镜、高处下扑、落地环形冲击与连击     |
| 12–17 秒 | 精英单位、蓄力近景、连续猎影突进与重击     |
| 17–22 秒 | 墙面折返、跃起、倒挂入镜、近身突袭         |
| 22–27 秒 | 半秒蓄能、环场连闪、密集爪痕与单点终结     |
| 27–30 秒 | 倒地敌群、收束电流、英雄定姿、前冲擦镜切黑 |

敌人由 6 人增加至 10 人，包含一个更大的精英单位。命中事件统一驱动敌人
失衡与倒地、爪痕、碎片、火花、冲击环、停顿和镜头震动。

无背景音乐。动作音效由文件内的确定性 Foley 合成器生成，包括破风、
电弧、低频撞击、金属震动及轻微呼吸；它们不是实拍同期录音。
浏览器可能要求先点击画面才能解锁声音；画面仍自动播放且不显示控件。
GIF 格式不支持音轨，MP4 保留完整音效。

## 实现与质量边界

这是写实材质的 **2.5D 动作动态分镜**：生成的角色姿态图集与工业场景底片，
配合连续路径、分层视差、镜头跟随、姿态切换与程序特效合成。
它不是完整骨骼驱动的三维电影成片；姿态间的肢体过渡、耳部微动作、立体绕拍、
真实接触形变及结构破坏尚未达到原始电影级 CG brief 的要求。
保留这些限制供审阅，不把技术检查通过作为电影质感验收。

本次由作者自审。检查过近景、战斗、倒挂、终结与收尾实际帧，修正过
前景遮挡和结束后敌人重新站起的问题。图像由本次 Image Gen 生成；
全部实际使用的图像字节已嵌入 HTML，HTML 是可编辑的唯一播放源。

## 导出与验证

HTML 暴露无界面的捕获接口：`window.film.ready`、`film.frame(0..899)`、
`film.seek(seconds)`、`film.audioBuffer()`。帧接口进入手动模式，停止自动推进；
重复采样同一帧得到相同画面。音频为 48kHz 单声道浮点采样。

在浏览器等待 `film.ready` 后，依次调用 `film.frame(i)` 并导出 canvas。
交付 GIF/MP4 使用全部 900 帧，分别导出为 512 × 288 和 960 × 540。
帧图片命名为 `%04d.jpg`，音效保存为 `foley.wav` 后：

```sh
ffmpeg -framerate 30 -i '%04d.jpg' -vf scale=512:288:flags=lanczos,palettegen=max_colors=96:stats_mode=diff palette.png
ffmpeg -framerate 30 -i '%04d.jpg' -i palette.png -lavfi '[0:v]scale=512:288:flags=lanczos[v];[v][1:v]paletteuse=dither=none:diff_mode=rectangle' -loop 0 -final_delay 3 golden-claw.gif
ffmpeg -framerate 30 -i '%04d.jpg' -i foley.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart -t 30 golden-claw.mp4
```

GIF 时间单位为 10ms，无法表达恒定的 33⅓ms 帧间隔。交付使用 30/40ms
交替延迟，900 帧总计恰好 30 秒，平均 30fps；MP4 为恒定 30fps。

维护测试解析 HTML 内联脚本、检查嵌入资源及无 UI/无网络依赖约束，并独立解析
GIF 的尺寸、全部图像块和总延迟。浏览器测试加载交付原文并拒绝额外请求，
检查七段画面的变化、重复 seek、结尾黑场、音频与窄屏比例。
这些测试位于现有工具测试和浏览器检查范围内。

```sh
node --test packages/workshop-tools/art/golden-claw.test.ts
npm run test:browser -- --project=functional tests/browser/golden-claw.spec.ts
```
