import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import { entities } from '@/shared/api/entities';
import { UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FamilyMember } from '@/shared/types/entities';

function FamilyMemberSwitcher() {
  const { t } = useTranslation();
  const { user, selectedFamilyMember, switchFamilyMember } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: familyMembers } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (member: FamilyMember | 'owner') => {
    switchFamilyMember(member);
    setIsOpen(false);
  };

  const getCurrentName = () => {
    if (selectedFamilyMember === 'owner') {
      return user?.full_name || user?.email || t('auth.accountOwner');
    }
    if (selectedFamilyMember) {
      return selectedFamilyMember.name;
    }
    return user?.full_name || user?.email || t('auth.accountOwner');
  };

  const getCurrentRelationship = () => {
    if (selectedFamilyMember === 'owner' || !selectedFamilyMember) {
      return t('auth.accountOwner');
    }
    return selectedFamilyMember.relationship;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg bg-white/30 hover:bg-white/40 border border-white/20 transition-all duration-300 text-sm"
      >
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {selectedFamilyMember === 'owner' || !selectedFamilyMember ? (
            <UserIcon className="w-4 h-4 text-blue-600" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {selectedFamilyMember.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left rtl:text-right">
            <div className="text-xs text-gray-500">{t('family.viewingAs')}</div>
            <div className="font-medium text-gray-800">{getCurrentName()}</div>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 glass-card backdrop-blur-xl bg-white/30 border border-white/20 rounded-lg shadow-xl z-50 animate-fade-in">
          <div className="py-2">
            {/* Owner Option */}
            <button
              onClick={() => handleSelect('owner')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 hover:bg-white/40 transition-colors ${
                selectedFamilyMember === 'owner' || !selectedFamilyMember
                  ? 'bg-blue-100/50 border-r-4 rtl:border-r-0 rtl:border-l-4 border-blue-500'
                  : ''
              }`}
            >
              <UserIcon className="w-5 h-5 text-blue-600" />
              <div className="flex-1 text-left rtl:text-right">
                <div className="font-medium text-gray-800">
                  {user.full_name || user.email}
                </div>
                <div className="text-xs text-gray-500">{t('auth.accountOwner')}</div>
              </div>
              {(selectedFamilyMember === 'owner' || !selectedFamilyMember) && (
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              )}
            </button>

            {/* Family Members */}
            {familyMembers?.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 hover:bg-white/40 transition-colors ${
                  selectedFamilyMember && selectedFamilyMember !== 'owner' && selectedFamilyMember.id === member.id
                    ? 'bg-blue-100/50 border-r-4 rtl:border-r-0 rtl:border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left rtl:text-right">
                  <div className="font-medium text-gray-800">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.relationship}</div>
                </div>
                {selectedFamilyMember &&
                  selectedFamilyMember !== 'owner' &&
                  selectedFamilyMember.id === member.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  )}
              </button>
            ))}

            {(!familyMembers || familyMembers.length === 0) && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {t('common.noData')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyMemberSwitcher;

