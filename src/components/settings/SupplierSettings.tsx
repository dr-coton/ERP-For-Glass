import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import * as api from '../../lib/tauri';
import type { SupplierSettings as SupplierSettingsType } from '../../types';

export default function SupplierSettings() {
  const [settings, setSettings] = useState<SupplierSettingsType>({
    business_id: '',
    company_name: '',
    representative: '',
    address: '',
    phone: '',
    fax: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSupplierSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load supplier settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSupplierSettings(settings);
      alert('공급자 정보가 저장되었습니다.');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SupplierSettingsType, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="max-w-2xl">
      <section className="p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">공급자 정보</h3>
        <p className="text-sm text-gray-600 mb-6">
          거래명세서에 표시될 공급자(판매자) 정보를 입력하세요.
        </p>

        <div className="space-y-4">
          <Input
            label="사업자등록번호"
            value={settings.business_id}
            onChange={(e) => handleChange('business_id', e.target.value)}
            placeholder="000-00-00000"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="상호"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="회사명"
            />
            <Input
              label="대표자"
              value={settings.representative}
              onChange={(e) => handleChange('representative', e.target.value)}
              placeholder="대표자명"
            />
          </div>

          <Input
            label="주소"
            value={settings.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="사업장 주소"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="전화번호"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="000-0000-0000"
            />
            <Input
              label="팩스"
              value={settings.fax}
              onChange={(e) => handleChange('fax', e.target.value)}
              placeholder="000-0000-0000"
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
