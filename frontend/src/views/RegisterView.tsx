import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterViewProps {
    onSwitchToLogin: () => void;
}

// 用户服务协议内容
const userAgreementContent = `
版本号：1.0
生效日期：2025年10月1日

欢迎使用"悟空伴读"！

为使用本服务，请您仔细阅读并遵守《用户服务协议》（以下简称"本协议"）。在您开始使用我们的服务前，请务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款。

当您通过页面勾选或点击"同意"并完成注册程序后，即表示您已充分阅读、理解并接受本协议的全部内容，本协议即在您与【你的公司全称】（以下简称"我们"）之间产生法律效力。

第一条 服务内容与模式

1.1 服务内容：我们提供一款名为"悟空伴读"的、基于人工智能技术的儿童学习专注度分析辅助工具（以下简称"本服务"）。本服务通过您设备的前置摄像头，定时采集图像并进行实时分析，向您提供关于儿童学习状态的分析结果与统计报告。

1.2 免费试用：我们为每一位新注册的用户提供自注册之日起为期七（7）日的免费全功能体验服务。免费试用期结束后，相关功能将受限。

1.3 付费服务：免费试用期结束后，您可选择一次性购买服务包以继续使用本服务。具体服务内容、期限及价格以购买页面公示为准。本服务为预付费模式，一经购买成功，非因我方重大过失或法律法规另有规定，费用不予退还。

第二条 监护人资格与义务

2.1 您承诺并保证，您是年满18周岁的成年人，并且是您所监护儿童的法定监护人。

2.2 您承诺将按照本App"首次使用向导"的指引，将设备固定于合理的家庭学习空间（如书房、客厅书桌），并确保拍摄画面不涉及卫生间、卧室等任何私密区域。

2.3 您承诺并保证，本服务仅用于您对被监护子女在家庭学习场景下的状态了解与积极引导，不得用于监控任何非被监护人，或任何其他非法、侵权用途。

第三条 账号使用规则

3.1 您应对您的账户信息（如手机号、验证码）妥善保管，并对在该账户下发生的所有活动承担责任。

3.2 您的账户仅限您本人使用，不得转让、赠与、出租或售卖给任何第三方。

第四条 知识产权

本服务所包含的所有内容，包括但不限于文字、图标、UI设计、软件代码，其知识产权均归我们所有。未经我们书面许可，您不得以任何形式复制、修改、传播或用于任何商业目的。

第五条 免责声明

5.1 本服务的分析结果仅基于AI模型对图像的识别，可能因拍摄角度、光线、儿童姿态等多种因素影响而产生误差。分析结果仅供您作为参考，不构成任何具备法律效力的证明或建议。

5.2 您应确保您的使用设备及网络环境安全。因您设备中毒、被黑客攻击或网络问题导致的数据泄露或服务中断，我们不承担责任。

第六条 服务变更与终止

6.1 我们有权根据业务发展需要，变更或升级服务内容。如有重大变更，我们将通过App内公告等方式提前通知您。

6.2 如您违反本协议任何条款，我们有权随时暂停或终止向您提供服务。

6.3 您可以随时通过App内的指引注销您的账户。账号注销后，我们将根据《隐私政策》的规定删除您的所有数据。

第七条 法律适用与争议解决

本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。如双方就本协议内容或其执行发生任何争议，应首先友好协商解决；协商不成的，任何一方均可向【你的公司所在地】人民法院提起诉讼。

第八条 其他

本协议内容同时包括我们可能不断发布的关于本服务的相关协议、规则等内容。上述内容一经正式发布，即为本协议不可分割的组成部分，您同样应当遵守。
`;

// 隐私政策内容
const privacyPolicyContent = `
版本号：1.0
生效日期：2025年10月1日

"悟空伴读"《隐私政策》

引言
我们深知个人信息对您的重要性，并会尽全力保护您和您孩子的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您和您孩子的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。

本政策将帮助您了解以下内容：
一、 我们如何收集和使用您和您孩子的个人信息
二、 我们如何使用 Cookie 和同类技术
三、 我们如何共享、转让、公开披露您的个人信息
四、 我们如何保护和保存您和您孩子的个人信息
五、 您的权利
六、 我们如何处理儿童的个人信息
七、 本政策如何更新
八、如何联系我们

一、我们如何收集和使用您和您孩子的个人信息

在您使用本服务过程中，我们会遵循合法、正当、必要的原则，收集和使用以下信息：

1.1 为完成注册：当您注册"悟空伴读"账户时，我们会收集您的手机号码，用于创建账户和身份验证。

1.2 为实现核心功能（学习专注度分析）：
* 摄像头权限（单独同意）：在您首次开启本服务核心功能前，我们会通过弹窗明确请求您的摄像头权限，在获得您的单独同意后，才会开启摄像头。
* 图像数据（实时处理，永不存储）：我们会通过摄像头定时采集儿童的学习场景图像。我们郑重承诺，所有原始图像数据仅用于实时传输至云端AI模型进行分析，我们绝不以任何形式存储、备份或保留任何原始图像数据。分析任务完成后，图像数据将立即在处理链路中被销毁。
* 衍生数据：AI模型分析后，会生成不包含任何可识别个人生物特征的衍生数据，包括：时间戳、学习状态标签（如"专注"、"分心"）、单日学习时长与分心次数统计。我们收集这些数据是为了向您生成和展示学习报告。

二、我们如何使用 Cookie 和同类技术
为确保本服务正常运转，我们会在您的设备上存储名为 Cookie 的小数据文件。Cookie 通常包含标识符、站点名称以及一些号码和字符。我们不会将 Cookie 用于本政策所述目的之外的任何用途。

三、我们如何共享、转让、公开披露您的个人信息

3.1 共享：我们不会与任何公司、组织和个人共享您的个人信息，但以下情况除外：
* 为实现核心功能所必需的共享：为实现AI分析功能，我们会将加密后的图像数据通过安全通道，共享给阿里云计算有限公司，以使用其"通义千问"大模型服务。我们已与该服务商签订严格的数据处理与保密协议，要求其严格遵守我们的数据保护要求，并禁止其将数据用于任何其他目的。
* 获得您的明确同意后。
* 在法定情形下的共享：我们可能会根据法律法规规定、诉讼争议解决需要，或按行政、司法机关依法提出的要求，对外共享您的个人信息。

3.2 转让：我们不会将您的个人信息转让给任何公司、组织和个人，但获取您明确同意的除外。

3.3 公开披露：我们仅会在获取您明确同意或基于法律的强制性要求下，公开披露您的个人信息。

四、我们如何保护和保存您和您孩子的个人信息

4.1 保护措施：我们已使用符合业界标准的安全防护措施保护您提供的信息，防止数据遭到未经授权的访问、公开披露、使用、修改、损坏或丢失。例如，我们会采用HTTPS协议进行加密传输，并采用加密技术对存储的衍生数据进行保护。

4.2 保存期限：
* 原始图像数据：不保存。
* 衍生数据：我们将保存您的衍生数据，直至您主动注销账户。当您注销账户后，我们将对您的衍生数据进行删除或匿名化处理。

五、您的权利

您可以通过以下方式访问及管理您的信息：

查询与更正：您可以登录App，查询您的账户信息和学习报告。

删除：您可以通过App内的功能，删除孩子所有的学习数据和分析结果。

注销账户：您可以通过App内的"账号注销"功能随时注销您的账户。

撤回同意：您可以在设备系统中关闭摄像头的授权，以撤回您的同意。请注意，撤回后您将无法使用本服务的核心功能。

六、我们如何处理儿童的个人信息

我们深知保护儿童个人信息的重要性。本服务面向儿童，由其监护人注册和使用。我们仅收集实现服务所必需的儿童相关信息（如前文所述的衍生数据），并严格按照本政策进行保护。若您作为监护人，对所监护儿童的个人信息保护有任何疑问或请求，请通过第八条的联系方式与我们联系。

七、本政策如何更新

我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本政策所应享有的权利。对于重大变更，我们会提供更为显著的通知（例如通过App内弹窗或消息推送）。

八、如何联系我们

如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：

公司名称：【上海家乐宝信息科技服务有限公司】

电子邮箱：【lijipz@163.com】

注册地址：【上海市嘉定区】
`;

const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showUserAgreement, setShowUserAgreement] = useState(false);
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      setError('请阅读并同意用户服务协议和隐私政策');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    setError('');
    setIsLoading(true);
    try {
      await register(phone, password);
    } catch (err: any) {
      // 使用用户友好的错误提示替代原始错误信息
      setError('注册失败，请检查手机号是否已被注册或稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 协议弹窗组件
  const AgreementModal = ({ isOpen, onClose, title, content }: { isOpen: boolean, onClose: () => void, title: string, content: string }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="p-4 overflow-y-auto flex-grow">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
              {content}
            </pre>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              我已阅读并同意
            </button>
          </div>
        </div>
      </div>
    );
  };
    
  return (
    <div>
      <form onSubmit={handleRegister} className="space-y-6">
        <h2 className="text-2xl font-semibold text-center text-yellow-400 animate-pulse">新英雄诞生</h2>
        <div className="bg-slate-900/50 p-4 rounded-lg border border-amber-400/30 text-center">
          <p className="text-center text-amber-300 font-medium">
            新用户注册，即享7天全功能免费体验！
          </p>
        </div>
        <div>
          <label htmlFor="phone-register" className="block text-sm font-medium text-slate-300">手机号码</label>
          <input
            id="phone-register"
            type="tel"
            value={phone}
            onChange={(e) => setPhone((e.currentTarget as HTMLInputElement).value)}
            placeholder="请输入11位手机号码"
            className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:shadow-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="password-register" className="block text-sm font-medium text-slate-300">设置密码</label>
          <input
            id="password-register"
            type="password"
            value={password}
            onChange={(e) => setPassword((e.currentTarget as HTMLInputElement).value)}
            placeholder="至少6位"
            className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:shadow-lg"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm-password-register" className="block text-sm font-medium text-slate-300">确认密码</label>
          <input
            id="confirm-password-register"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword((e.currentTarget as HTMLInputElement).value)}
            placeholder="请再次输入密码"
            className="mt-1 block w-full p-3 border border-slate-600 rounded-md bg-slate-900/50 text-slate-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-300 hover:shadow-lg"
            required
          />
        </div>
        
        {/* 协议同意选项 */}
        <div className="flex items-center">
          <input
            id="terms-agreement"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 text-amber-500 focus:ring-amber-400 border-slate-600 rounded"
          />
          <label htmlFor="terms-agreement" className="ml-2 block text-sm text-slate-300">
            我已阅读并同意
            <button
              type="button"
              onClick={() => setShowUserAgreement(true)}
              className="text-amber-400 hover:text-amber-300 ml-1 mr-1"
            >
              《用户服务协议》
            </button>
            和
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-amber-400 hover:text-amber-300 ml-1"
            >
              《隐私政策》
            </button>
          </label>
        </div>
        
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
        
        <button
          type="submit"
          disabled={isLoading || !agreedToTerms}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-slate-900 bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-400 disabled:opacity-60 transition-all transform hover:scale-105 duration-300"
        >
          {isLoading ? '注册中...' : '注册并开始冒险'}
        </button>
        <p className="text-center text-sm text-slate-400">
          已有账户？{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors duration-300">
            返回登录
          </button>
        </p>
      </form>
      
      {/* 用户服务协议弹窗 */}
      <AgreementModal
        isOpen={showUserAgreement}
        onClose={() => setShowUserAgreement(false)}
        title="用户服务协议"
        content={userAgreementContent}
      />
      
      {/* 隐私政策弹窗 */}
      <AgreementModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        title="隐私政策"
        content={privacyPolicyContent}
      />
    </div>
  );
};

export default RegisterView;