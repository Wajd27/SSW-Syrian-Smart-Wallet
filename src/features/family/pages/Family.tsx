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
import DatePicker from '@/shared/components/Forms/DatePicker';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { FamilyMember } from '@/shared/types/entities';

function Family() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email });
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: entities.familyMember.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamilyMember> }) =>
      entities.familyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsModalOpen(false);
      setEditingMember(null);
      resetForm();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      entities.familyMember.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      date_of_birth: '',
    });
  };

  const handleOpenModal = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        relationship: member.relationship,
        date_of_birth: member.date_of_birth || '',
      });
    } else {
      setEditingMember(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.id,
        data: {
          ...formData,
          date_of_birth: formData.date_of_birth || undefined,
        },
      });
    } else {
      createMutation.mutate({
        ...formData,
        added_by: user!.email,
        is_active: true,
        date_of_birth: formData.date_of_birth || undefined,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  const relationships = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Other',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('family.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('family.addMember')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members?.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.relationship}</p>
              {member.date_of_birth && (
                <p className="text-xs text-gray-400">
                  {new Date(member.date_of_birth).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenModal(member)}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={member.is_active ? 'secondary' : 'primary'}
                size="sm"
                onClick={() =>
                  toggleActiveMutation.mutate({
                    id: member.id,
                    is_active: !member.is_active,
                  })
                }
              >
                {member.is_active ? t('common.deactivate') : t('common.activate')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {members?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
          resetForm();
        }}
        title={editingMember ? t('family.editMember') : t('family.addMember')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('family.memberName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label={t('family.relationship')}
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            options={[
              { value: '', label: t('common.select') },
              ...relationships.map((rel) => ({ value: rel, label: rel })),
            ]}
            required
          />
          <DatePicker
            label={t('family.dateOfBirth')}
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMember(null);
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

export default Family;
