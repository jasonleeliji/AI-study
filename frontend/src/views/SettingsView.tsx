import React, { useState, useEffect, useCallback } from 'react';
import { ChildProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Spinner from '../components/common/Spinner';
import ChangePasswordView from './ChangePasswordView';
import { useNavigate } from 'react-router-dom';

interface SettingsViewProps {
  onSettingsSaved: () => void;
}

// 用户服务协议内容
const userAgreementContent = `
版本号：1.0
生效日期：2025年10月1日

欢迎使用"悟空伴读"！

为使用本服务，请您仔细阅读并遵守《用户服务协议》（以下简称"本协议"）。在您开始使用我们的服务前，请务必审慎阅读、充分理解各条款内容，特别是免除或者限制责任的条款。

当您通过页面勾选或点击"同意"并完成注册程序后，即表示您已充分阅读、理解并接受本协议的全部内容，本协议即在您与【你的公司全称】（以下简称"我们"）之间产生法律效力。

第一条 服务内容与模式

1.1 服务内容：我们提供一款名为"悟空伴读"的、基于人工智能技术的儿童学习专注度分析辅助工具（以下简称"本服务"）。本服务通过您设备的前置摄像头，定时采集图像并进行实时分析，向您提供关于儿童学习状态的分析结果。

1.2 免费试用：我们为每一位新注册的用户提供自注册之日起为期七（7）日的免费全功能体验服务。免费试用期结束后，相关功能将受限。

1.3 付费服务：免费试用期结束后，您可选择一次性购买服务包以继续使用本服务。具体服务内容、期限及价格以购买页面公示为准。本服务为预付费模式，一经购买成功，非因我方重大过失或法律法规另有规定，费用不予退还。

第二条 监护人资格与义务

2.1 您确认并保证：您是被监测儿童的合法监护人，或已获得该儿童合法监护人的明确授权。

2.2 您应确保被监测的儿童年龄在3-18周岁之间，并已向儿童说明本服务的基本功能。

2.3 您有义务合理使用分析结果，不得将其作为对儿童进行过度管制或惩罚的唯一依据。

第三条 账户管理

3.1 您应对您的账户信息（如手机号、验证码）妥善保管，并对在该账户下发生的所有活动承担责任。

3.2 您的账户仅限您本人使用，不得转让、赠与、出租或售卖给任何第三方。

第四条 知识产权

本服务所包含的所有内容，包括但不限于文字、图标、UI设计、软件代码，其知识产权均归我们所有。未经我们书面许可，您不得以任何形式复制、修改、传播或用于任何商业目的。

第五条 免责声明

5.1 本服务的分析结果仅基于AI模型对图像的识别，可能因拍摄角度、光线、儿童姿态多种因素影响而产生误差。分析结果仅供您作为参考，不构成任何具备法律效力的证明或建议。

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
我们深知个人信息对您的重要性，并会尽力保护您和您孩子的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您和您孩子的个人信息：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。

本政策将帮助您了解以下内容：
一、我们如何收集和使用您和您孩子的个人信息
二、我们如何使用 Cookie 和同类技术
三、我们如何共享、转让、公开披露您的个人信息
四、我们如何保护和保存您和您孩子的个人信息
五、您的权利
六、我们如何处理儿童的个人信息
七、本政策如何更新
八、如何联系我们

一、我们如何收集和使用您和您孩子的个人信息

1.1 为了向您提供我们的服务，我们会收集和使用您和您孩子的个人信息。我们会按照如下方式收集您和您孩子在使用服务时主动提供的，以及通过自动化手段收集您和您孩子在使用功能或接受服务过程中产生的信息：

* 账户信息：当您注册账户时，我们会收集您的手机号码，用于账户注册、登录验证和重要通知发送。
* 儿童基本信息：为了提供个性化的学习分析服务，我们会收集您孩子的姓名、年龄、年级等基本信息。
* 图像信息：为实现核心功能，我们会通过您设备的前置摄像头定时采集图像。这些图像仅用于AI分析儿童学习状态，分析完成后立即删除，不会存储在我们的服务器上。
* 设备信息：我们会收集您的设备型号、操作系统版本、设备标识符等信息，用于服务优化和问题排查。
* 日志信息：当您使用我们的服务时，我们会自动收集您对我们服务的详细使用情况，作为有关网络监测数据的日志保存。

1.2 我们收集和使用上述信息的目的在于：
* 向您提供、维护、改进我们的服务；
* 处理您的查询和请求；
* 向您发送服务相关的通知；
* 改善用户体验；
* 遵守适用的法律法规及监管要求。

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

4.1 我们使用各种安全技术和程序，以防信息的丢失、不当使用、未经授权阅览或披露。

4.2 我们会采取一切合理可行的措施，确保未收集无关的个人信息。我们只会在达成本政策所述目的所需的期限内保留您的个人信息，除非需要延长保留期或受到法律的允许。

4.3 互联网并非绝对安全的环境，而且电子邮件、即时通讯、及与其他用户的交流方式并未加密，我们强烈建议您不要通过此类方式发送个人信息。

五、您的权利

按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利：

5.1 访问您的个人信息
5.2 更正您的个人信息
5.3 删除您的个人信息
5.4 改变您授权同意的范围
5.5 注销账户

六、我们如何处理儿童的个人信息

我们的产品、网站和服务主要面向成人。如果没有父母或监护人的同意，儿童不得创建自己的用户账户。

对于经父母同意而收集儿童个人信息的情况，我们只会在受到法律允许、父母或监护人明确同意或者保护儿童所必要的情况下使用或公开披露此信息。

七、本政策如何更新

我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本政策所应享有的权利。对于重大变更，我们会提供更为显著的通知（例如通过App内弹窗或消息推送）。

八、如何联系我们

如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：

公司名称：【你的公司全称】

电子邮箱：【你的客服邮箱】

注册地址：【你的公司注册地址】

（完）
`;

// 输入字段组件
const InputField: React.FC<{
  label: string;
  name: keyof ChildProfile;
  type?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, type = 'text', unit, min, max, step, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-900 dark:text-slate-100">{label}</label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className="block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
      />
      {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-700 dark:text-slate-300 text-sm">{unit}</div>}
    </div>
  </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsSaved }) => {
  const [profile, setProfile] = useState<ChildProfile>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showUserAgreement, setShowUserAgreement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState('child-info');
  const { effectiveDailyLimit } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!showPrivacyPolicy) {
        try {
          setIsLoading(true);
          const { data } = await api.user.getProfile();
          setProfile(data);
        } catch (err) {
          setError('无法加载设置。');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSettings();
  }, [showPrivacyPolicy]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumberInput = type === 'number';
    const numValue = isNumberInput ? Number(value) : value;
    
    setProfile(prev => {
      if (!prev) return prev;
      const updates: any = {
        ...prev,
        [name]: numValue,
      };
      
      // 同时更新对应的后端字段名
      if (name === 'continuousStudyTime') {
        updates.workDurationBeforeForcedBreak = numValue;
      } else if (name === 'forcedBreakTime') {
        updates.forcedBreakDuration = numValue;
      }
      
      return updates;
    });
  }, []);
  


  const handleSupervisionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const updateData = {
        ...profile,
        workDurationBeforeForcedBreak: parseInt(profile?.continuousStudyTime?.toString() || '30'),
        forcedBreakDuration: parseInt(profile?.forcedBreakTime?.toString() || '10')
      };
      
      const result = await api.user.updateProfile(updateData);
      
      // 更新本地profile状态为后端返回的最新数据
      if (result.data) {
        setProfile(result.data);
      }
      
      onSettingsSaved();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      console.error('保存监督设置失败:', err);
      console.error('错误详情:', err.response?.data || err.message);
      setError('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChildInfoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await api.user.updateProfile(profile);
      
      onSettingsSaved();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err: any) {
      setError('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisagreePrivacy = () => {
    if (window.confirm('您确定要撤回隐私协议同意吗？这将导致您无法继续使用我们的服务。')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  const menuItems = [
    {
      id: 'child-info',
      label: '孩子信息',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'supervision',
      label: '监督设置',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'security',
      label: '账户安全',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'privacy',
      label: '隐私协议',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex">
            {/* 左侧导航菜单 */}
            <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">系统设置</h2>
                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 p-6">
              {/* 状态提示 */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                  </div>
                </div>
              )}

              {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 dark:text-green-300 font-medium">设置保存成功！</span>
                  </div>
                </div>
              )}

              {/* 内容区域 */}
              {activeTab === 'child-info' && (
                <div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 mb-6 rounded-t-xl">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="text-xl font-bold text-white">孩子信息</h3>
                    </div>
                    <p className="text-blue-100 mt-1">更新您孩子的个人资料和偏好。</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-6 py-6 rounded-b-xl border border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleChildInfoSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="昵称"
                          name="nickname"
                          value={profile?.nickname || ''}
                          onChange={handleChange}
                        />
                        <InputField
                          label="年龄"
                          name="age"
                          type="number"
                          min={3}
                          max={18}
                          value={profile?.age?.toString() || ''}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="grade" className="block text-sm font-medium text-slate-900 dark:text-slate-100">年级</label>
                          <select
                            name="grade"
                            id="grade"
                            value={profile?.grade || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="幼儿园">幼儿园</option>
                            <option value="小学一年级">小学一年级</option>
                            <option value="小学二年级">小学二年级</option>
                            <option value="小学三年级">小学三年级</option>
                            <option value="小学四年级">小学四年级</option>
                            <option value="小学五年级">小学五年级</option>
                            <option value="小学六年级">小学六年级</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-slate-900 dark:text-slate-100">性别</label>
                          <select
                            name="gender"
                            id="gender"
                            value={profile?.gender || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="boy">男孩</option>
                            <option value="girl">女孩</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit" 
                          disabled={isSaving}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="mr-2"><Spinner size="sm" /></div>
                              <span>保存中...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>保存设置</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'supervision' && (
                <div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4 mb-6 rounded-t-xl">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-white">监督设置</h3>
                    </div>
                    <p className="text-green-100 mt-1">配置学习时间和休息提醒。</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-6 py-6 rounded-b-xl border border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleSupervisionSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">每日最长学习时间</label>
                          <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                            <span className="text-slate-900 dark:text-slate-100 font-medium">{effectiveDailyLimit} 分钟</span>
                          </div>
                        </div>
                        <InputField
                          label="连续学习时长"
                          name="continuousStudyTime"
                          type="number"
                          unit="分钟"
                          min={10}
                          max={120}
                          step={5}
                          value={(profile?.continuousStudyTime || profile?.workDurationBeforeForcedBreak)?.toString() || '30'}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                          label="强制休息时长"
                          name="forcedBreakTime"
                          type="number"
                          unit="分钟"
                          min={5}
                          max={30}
                          step={1}
                          value={(profile?.forcedBreakTime || profile?.forcedBreakDuration)?.toString() || '10'}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit" 
                          disabled={isSaving}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium text-sm"
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="mr-2"><Spinner size="sm" /></div>
                              <span>保存中...</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>保存设置</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 mb-6 rounded-t-xl">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h3 className="text-xl font-bold text-white">账户安全</h3>
                    </div>
                    <p className="text-orange-100 mt-1">管理您的账户安全设置。</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-6 py-6 rounded-b-xl border border-slate-200 dark:border-slate-700">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">修改密码</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">更新您的账户密码以保护安全</p>
                        </div>
                        <button
                          onClick={() => setShowChangePassword(true)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          修改密码
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 mb-6 rounded-t-xl">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h3 className="text-xl font-bold text-white">隐私协议</h3>
                    </div>
                    <p className="text-purple-100 mt-1">查看和管理您的隐私设置。</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-6 py-6 rounded-b-xl border border-slate-200 dark:border-slate-700">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">查看用户服务协议</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">了解我们的服务条款和使用规则</p>
                        </div>
                        <button
                          onClick={() => setShowUserAgreement(true)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          查看协议
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">查看隐私政策</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">了解我们如何保护您的隐私</p>
                        </div>
                        <button
                          onClick={() => setShowPrivacyPolicy(true)}
                          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          查看协议
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div>
                          <h4 className="font-medium text-red-900 dark:text-red-100">撤回隐私协议同意</h4>
                          <p className="text-sm text-red-600 dark:text-red-400">撤回同意将导致无法继续使用服务</p>
                        </div>
                        <button
                          onClick={handleDisagreePrivacy}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 font-medium text-sm flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          撤回同意
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 用户服务协议弹窗 */}
      {showUserAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">用户服务协议</h2>
                <button 
                  onClick={() => setShowUserAgreement(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{userAgreementContent}</pre>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowUserAgreement(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 隐私政策弹窗 */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">隐私政策</h2>
                <button 
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 text-2xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{privacyPolicyContent}</pre>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 修改密码弹窗 */}
      {showChangePassword && (
        <ChangePasswordView onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default SettingsView;