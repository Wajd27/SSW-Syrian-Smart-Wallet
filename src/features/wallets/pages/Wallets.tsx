import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import Modal from '@/shared/components/Modal/Modal';
import Input from '@/shared/components/Forms/Input';
import Select from '@/shared/components/Forms/Select';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Wallet as WalletType } from '@/shared/types/entities';

function Wallets() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'personal',
    currency: 'SYP',
    initial_balance: 0,
  });

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email });
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: entities.wallet.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WalletType> }) =>
      entities.wallet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsModalOpen(false);
      setEditingWallet(null);
      resetForm();
    },
  });


  const resetForm = () => {
    setFormData({
      name: '',
      type: 'personal',
      currency: 'SYP',
      initial_balance: 0,
    });
  };

  const handleOpenModal = (wallet?: WalletType) => {
    if (wallet) {
      setEditingWallet(wallet);
      setFormData({
        name: wallet.name,
        type: wallet.type,
        currency: wallet.currency,
        initial_balance: wallet.initial_balance,
      });
    } else {
      setEditingWallet(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWallet) {
      updateMutation.mutate({
        id: editingWallet.id,
        data: formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        owner_email: user!.email,
        is_active: true,
      });
    }
  };

  const handleToggleActive = (wallet: WalletType) => {
    updateMutation.mutate({
      id: wallet.id,
      data: { is_active: !wallet.is_active },
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('wallets.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('wallets.addWallet')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets?.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{wallet.name}</h3>
                <p className="text-sm text-gray-500">{wallet.type}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  wallet.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {wallet.is_active ? t('wallets.active') : t('wallets.inactive')}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t('wallets.currency')}: {wallet.currency}
              </p>
              <p className="text-sm text-gray-600">
                {t('wallets.initialBalance')}: {wallet.initial_balance.toLocaleString()}{' '}
                {wallet.currency}
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenModal(wallet)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleToggleActive(wallet)}
              >
                {wallet.is_active ? (
                  <TrashIcon className="w-4 h-4" />
                ) : (
                  <span>{t('common.restore')}</span>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {wallets?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWallet(null);
          resetForm();
        }}
        title={editingWallet ? t('wallets.editWallet') : t('wallets.addWallet')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('wallets.walletName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label={t('wallets.walletType')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' },
              { value: 'savings', label: 'Savings' },
            ]}
          />
          <Select
            label={t('wallets.currency')}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[
              { value: 'SYP', label: 'SYP' },
              { value: 'USD', label: 'USD' },
            ]}
          />
          <Input
            label={t('wallets.initialBalance')}
            type="number"
            step="0.01"
            value={formData.initial_balance}
            onChange={(e) =>
              setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })
            }
            required
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingWallet(null);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Wallets;
