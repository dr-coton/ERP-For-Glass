import { useState, useEffect } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import Button from '../ui/Button';
import * as api from '../../lib/tauri';

export default function DataManagement() {
  const [dbPath, setDbPath] = useState('');

  useEffect(() => {
    loadDbPath();
  }, []);

  const loadDbPath = async () => {
    try {
      const path = await api.getDatabasePath();
      setDbPath(path);
    } catch (error) {
      console.error('Failed to get database path:', error);
    }
  };

  const handleExport = async () => {
    const path = await save({
      defaultPath: 'database_backup.db',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (path) {
      try {
        await api.exportDatabase(path);
        alert('데이터베이스 내보내기가 완료되었습니다.');
      } catch (error) {
        alert('내보내기 중 오류가 발생했습니다: ' + error);
      }
    }
  };

  const handleImport = async () => {
    const confirmed = confirm(
      '데이터베이스를 가져오면 현재 데이터가 모두 대체됩니다. 계속하시겠습니까?'
    );
    if (!confirmed) return;

    const path = await open({
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (path) {
      try {
        await api.importDatabase(path as string);
        alert(
          '데이터베이스 가져오기가 완료되었습니다. 변경사항을 적용하려면 앱을 재시작하세요.'
        );
      } catch (error) {
        alert('가져오기 중 오류가 발생했습니다: ' + error);
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* 데이터 관리 */}
      <section className="p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 관리</h3>
        <p className="text-sm text-gray-600 mb-6">
          데이터베이스를 백업하거나 기존 백업에서 복원할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleExport}>
              데이터베이스 내보내기
            </Button>
            <span className="text-sm text-gray-500">
              현재 데이터를 파일로 저장합니다.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handleImport}>
              데이터베이스 가져오기
            </Button>
            <span className="text-sm text-gray-500">
              백업 파일에서 데이터를 복원합니다.
            </span>
          </div>
        </div>
      </section>

      {/* 정보 */}
      <section className="p-6 bg-white rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">정보</h3>

        <div className="space-y-3 text-sm">
          <div className="flex">
            <span className="text-gray-500 w-32">버전</span>
            <span className="text-gray-900">1.0.0</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 w-32">데이터베이스 경로</span>
            <span className="text-gray-900 break-all">{dbPath}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
