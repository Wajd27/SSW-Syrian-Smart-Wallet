import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card title={t('dashboard.quickActions')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/transactions?action=add')}
          className="w-full justify-center"
        >
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('dashboard.addTransaction')}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/family?action=add')}
          className="w-full justify-center"
        >
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('dashboard.addFamilyMember')}
        </Button>
      </div>
    </Card>
  );
}

export default QuickActions;

