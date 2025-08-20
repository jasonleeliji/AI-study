import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="protocol-content mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded">
      <div className="space-y-4 text-sm">
        <div className="bg-yellow-50 dark:bg-amber-900/30 border-l-4 border-yellow-400 p-4">
          <p className="font-bold">老板跪读提示：</p>
          <p>本协议由1.5人团队（含老板和兼职大学生）在3杯奶茶+1次通宵后激情撰写</p>
          <p>如有雷同，说明你也快猝死了</p>
        </div>

        <h3 className="font-bold text-lg">第一章 我们拿啥保护您孩子？</h3>
        <h4 className="font-semibold">1.1 摄像头</h4>
        <ul className="list-disc pl-5">
          <li>拍的是<strong>360p祖传马赛克画质</strong>（480x360像素）</li>
          <li>高清？不存在的！连孩子脸上的痘都拍不清</li>
        </ul>

        <h4 className="font-semibold">1.2 数据传输</h4>
        <ul className="list-disc pl-5">
          <li>走的<strong>HTTPS加密通道</strong>（和您银行卡同款）</li>
          <li>但万一被黑客盯上... 建议祈祷他们更想偷《原神》账号</li>
        </ul>

        <h4 className="font-semibold">1.3 阿里云AI</h4>
        <ul className="list-disc pl-5">
          <li>我们把图塞给<strong>阿里家的AI大爷</strong>（qwen-vl-plus）</li>
          <li>大爷看完就失忆（<strong>不存图</strong>，毕竟内存挺贵的）</li>
        </ul>

        <h3 className="font-bold text-lg">第二章 我们记了啥？</h3>
        <h4 className="font-semibold">2.1 记仇小本本</h4>
        <p>只存三行字：</p>
        <ul className="list-disc pl-5">
          <li>📅 [日期] 离座：3次</li>
          <li>⏱️ 专注：38分钟</li>
          <li>🥱 摸鱼：12分钟</li>
        </ul>
        <p className="italic">比您初恋日记还简略</p>

        <h4 className="font-semibold">2.2 删库指南</h4>
        <ul className="list-disc pl-5">
          <li>想清空数据？点击<strong>[修行报告]</strong>→<strong>[抹去修行记录]</strong>（老板通宵开发的功能）</li>
          <li>删除后数据去向：<code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">[已变成老板家狗的零食]</code></li>
        </ul>

        <h3 className="font-bold text-lg">第三章 监护人权力争霸赛</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-slate-300 dark:border-slate-600">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="border border-slate-300 dark:border-slate-600 px-2 py-1">功能</th>
                <th className="border border-slate-300 dark:border-slate-600 px-2 py-1">ALI爸爸</th>
                <th className="border border-slate-300 dark:border-slate-600 px-2 py-1">本小作坊</th>
                <th className="border border-slate-300 dark:border-slate-600 px-2 py-1">胜负</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">监护人验证</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">手机号注册即默认同意</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">要收<strong>短信验证码</strong>！</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">👉 我们赢麻了</td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">数据删除</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">需填表等30天</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">点完就删<strong>只要3秒</strong></td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">🚀 火箭级碾压</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">协议可读性</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">律师写的天书</td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">本<strong>小学生作文</strong></td>
                <td className="border border-slate-300 dark:border-slate-600 px-2 py-1">🤣 人类进步奖</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-bold text-lg">第四章 甩锅声明（重点）</h3>
        <h4 className="font-semibold">4.1 阿里云行为</h4>
        <blockquote className="border-l-4 border-slate-400 pl-4 italic">
          "如果阿里云偷存图（这基本没可能） → <strong>请直接指责马老师</strong><br />
          我们小透明只配帮您拨客服电话"
        </blockquote>

        <h4 className="font-semibold">4.2 黑客攻击</h4>
        <blockquote className="border-l-4 border-slate-400 pl-4 italic">
          "若被黑 → 赔您：<br />
          - <strong>年度VIP会员</strong>（价值￥198）<br />
          - <strong>奶茶券×5</strong>（老板代喝验证）<br />
          - <strong>老板跪唱《征服》</strong>（可选）"
        </blockquote>

        <h4 className="font-semibold">4.3 政府检查</h4>
        <blockquote className="border-l-4 border-slate-400 pl-4 italic">
          "网信办来人 → 请扫描：<br />
          ![逃跑路线图](https://example.com/qr-runaway.png)<br />
          （这是我们连夜逃跑路线图）"
        </blockquote>

        <h3 className="font-bold text-lg">第五章 怎么同意？</h3>
        <p>勾选即视为：</p>
        <ul className="list-disc pl-5">
          <li>您已知晓我们是<strong>穷且诚实</strong>的穷逼团队</li>
          <li>接受<strong>比阿里少50%的逼格但多200%的真诚</strong></li>
          <li>允许老板用协议擦眼泪 💧</li>
        </ul>
      </div>
    </div>
  );
};

export default PrivacyPolicy;