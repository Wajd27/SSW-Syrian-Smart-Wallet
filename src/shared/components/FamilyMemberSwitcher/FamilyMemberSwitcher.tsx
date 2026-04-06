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


  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white/90 hover:bg-white border border-app-border transition-all duration-200 text-xs sm:text-sm"
      >
        <div className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse">
          {selectedFamilyMember === 'owner' || !selectedFamilyMember ? (
            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
          ) : (
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-accent-green flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-white">
                {selectedFamilyMember.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left rtl:text-right hidden sm:block">
            <div className="text-xs text-muted">{t('family.viewingAs')}</div>
            <div className="font-medium text-app truncate max-w-[80px]">{getCurrentName()}</div>
          </div>
          <div className="text-left rtl:text-right sm:hidden">
            <div className="font-medium text-app truncate max-w-[60px] text-xs">{getCurrentName()}</div>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-app-soft transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 surface-panel rounded-xl z-50 animate-fade-in">
          <div className="py-2">
            {/* Owner Option */}
            <button
              onClick={() => handleSelect('owner')}
              className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 hover:bg-app-bg transition-colors ${
                selectedFamilyMember === 'owner' || !selectedFamilyMember
                  ? 'bg-chip-bg border-r-4 rtl:border-r-0 rtl:border-l-4 border-primary-500'
                  : ''
              }`}
            >
              <UserIcon className="w-5 h-5 text-primary-500" />
              <div className="flex-1 text-left rtl:text-right">
                <div className="font-medium text-app">
                  {user.full_name || user.email}
                </div>
                <div className="text-xs text-muted">{t('auth.accountOwner')}</div>
              </div>
              {(selectedFamilyMember === 'owner' || !selectedFamilyMember) && (
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              )}
            </button>

            {/* Family Members */}
            {familyMembers?.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className={`w-full flex items-center space-x-3 rtl:space-x-reverse px-4 py-3 hover:bg-app-bg transition-colors ${
                  selectedFamilyMember && selectedFamilyMember !== 'owner' && selectedFamilyMember.id === member.id
                    ? 'bg-chip-bg border-r-4 rtl:border-r-0 rtl:border-l-4 border-primary-500'
                    : ''
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left rtl:text-right">
                  <div className="font-medium text-app">{member.name}</div>
                  <div className="text-xs text-muted">{member.relationship}</div>
                </div>
                {selectedFamilyMember &&
                  selectedFamilyMember !== 'owner' &&
                  selectedFamilyMember.id === member.id && (
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  )}
              </button>
            ))}

            {(!familyMembers || familyMembers.length === 0) && (
              <div className="px-4 py-3 text-sm text-muted text-center">
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

