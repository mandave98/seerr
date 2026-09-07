import Modal from '@app/components/Common/Modal';
import PermissionEdit from '@app/components/PermissionEdit';
import useToasts from '@app/hooks/useToasts';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

interface BulkEditProps {
  selectedUserIds: number[];
  users?: User[];
  onCancel?: () => void;
  onComplete?: (updatedUsers: User[]) => void;
  onSaving?: (isSaving: boolean) => void;
}

const messages = defineMessages('components.UserList', {
  userssaved: 'User permissions saved successfully!',
  userfail: 'Something went wrong while saving user permissions.',
  edituser: 'Edit User Permissions',
});

const BulkEditModal = ({
  selectedUserIds,
  users,
  onCancel,
  onComplete,
  onSaving,
}: BulkEditProps) => {
  const { user: currentUser } = useUser();
  const intl = useIntl();
  const { addToast } = useToasts();
  const [currentPermission, setCurrentPermission] = useState(0);
  // Permissions only some selected users have; left untouched on save unless toggled
  const [mixedPermissions, setMixedPermissions] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (onSaving) {
      onSaving(isSaving);
    }
  }, [isSaving, onSaving]);

  const updateUsers = async () => {
    try {
      setIsSaving(true);
      const { data: updated } = await axios.put<User[]>(`/api/v1/user`, {
        ids: selectedUserIds,
        permissions: currentPermission,
        preservePermissions: mixedPermissions,
      });
      if (onComplete) {
        onComplete(updated);
      }
      addToast(intl.formatMessage(messages.userssaved), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch {
      addToast(intl.formatMessage(messages.userfail), {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (users) {
      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
      // Start from the permissions every selected user has; the rest are shown as mixed
      const everyone = selectedUsers.reduce(
        (acc, u) => acc & u.permissions,
        ~0
      );
      const anyone = selectedUsers.reduce((acc, u) => acc | u.permissions, 0);
      setCurrentPermission(everyone & anyone);
      setMixedPermissions(anyone & ~everyone);
    }
  }, [users, selectedUserIds]);

  return (
    <Modal
      title={intl.formatMessage(messages.edituser)}
      onOk={() => {
        updateUsers();
      }}
      okDisabled={isSaving}
      okText={intl.formatMessage(globalMessages.save)}
      onCancel={onCancel}
    >
      <div className="mb-6">
        <PermissionEdit
          actingUser={currentUser}
          currentPermission={currentPermission}
          mixedPermissions={mixedPermissions}
          onUpdate={(newPermission) => {
            // A toggled permission is no longer mixed and is written for every user
            setMixedPermissions(
              mixedPermissions & ~(newPermission ^ currentPermission)
            );
            setCurrentPermission(newPermission);
          }}
        />
      </div>
    </Modal>
  );
};

export default BulkEditModal;
