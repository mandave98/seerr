import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import RequestComment from '@app/components/RequestComments/RequestComment';
import { Permission, useUser } from '@app/hooks/useUser';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import type { MediaRequest } from '@server/entity/MediaRequest';
import type { NonFunctionProperties } from '@server/interfaces/api/common';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import { useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';

const messages = defineMessages('components.RequestComments', {
  comments: 'Comments',
  nocomments: 'No comments.',
  commentplaceholder: 'Add a comment…',
  leavecomment: 'Comment',
  validationComment: 'You must enter a message',
});

interface RequestCommentsModalProps {
  show: boolean;
  requestId: number;
  onCancel: () => void;
}

const RequestCommentsModal = ({
  show,
  requestId,
  onCancel,
}: RequestCommentsModalProps) => {
  const intl = useIntl();
  const { user: currentUser, hasPermission } = useUser();
  const { data: requestData, mutate: revalidateRequest } = useSWR<
    NonFunctionProperties<MediaRequest>
  >(show ? `/api/v1/request/${requestId}` : null);

  const CommentSchema = Yup.object().shape({
    message: Yup.string().required(
      intl.formatMessage(messages.validationComment)
    ),
  });

  const belongsToUser = requestData?.requestedBy.id === currentUser?.id;
  const comments = requestData?.comments ?? [];

  return (
    <Transition
      as="div"
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={show}
    >
      <Modal
        title={intl.formatMessage(messages.comments)}
        onCancel={onCancel}
        cancelText={intl.formatMessage(globalMessages.close)}
        loading={!requestData}
      >
        <div className="pb-2">
          {comments.map((comment) => (
            <RequestComment
              comment={comment}
              key={`request-comment-${comment.id}`}
              isReversed={requestData?.requestedBy.id === comment.user.id}
              isActiveUser={comment.user.id === currentUser?.id}
              onUpdate={() => revalidateRequest()}
            />
          ))}
          {comments.length === 0 && (
            <div className="mt-4 text-gray-400">
              <span>{intl.formatMessage(messages.nocomments)}</span>
            </div>
          )}
          {(hasPermission(Permission.MANAGE_REQUESTS) || belongsToUser) && (
            <Formik
              initialValues={{
                message: '',
              }}
              validationSchema={CommentSchema}
              onSubmit={async (values, { resetForm }) => {
                await axios.post(`/api/v1/request/${requestId}/comment`, {
                  message: values.message,
                });
                revalidateRequest();
                resetForm();
              }}
            >
              {({ isValid, isSubmitting, values }) => {
                return (
                  <Form>
                    <div className="mt-6">
                      <Field
                        id="message"
                        name="message"
                        as="textarea"
                        placeholder={intl.formatMessage(
                          messages.commentplaceholder
                        )}
                        className="h-20"
                      />
                      <div className="mt-4 flex items-center justify-end space-x-2">
                        <Button
                          type="submit"
                          buttonType="primary"
                          disabled={!isValid || isSubmitting || !values.message}
                        >
                          <ChatBubbleOvalLeftEllipsisIcon />
                          <span>
                            {intl.formatMessage(messages.leavecomment)}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          )}
        </div>
      </Modal>
    </Transition>
  );
};

export default RequestCommentsModal;
