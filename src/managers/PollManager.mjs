import { CordXRest } from '../rest/CordXRest.mjs';
import { CordXError, CordXErrorCode } from '../errors/CordXError.mjs';

export class PollManager {
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  async create(channelId, options) {
    const { question, answers, duration = 24, allowMultiselect = false, layoutType = 1, content } = options;

    if (!question) throw new CordXError(CordXErrorCode.INVALID_FORM_BODY, 'question is required');
    if (!answers?.length) throw new CordXError(CordXErrorCode.INVALID_FORM_BODY, 'at least one answer is required');
    if (answers.length > 10) throw new CordXError(CordXErrorCode.POLL_TOO_MANY_ANSWERS);
    if (duration < 1 || duration > 168) throw new CordXError(CordXErrorCode.POLL_INVALID_DURATION);

    return this._rest.request('POST', `/channels/${channelId}/messages`, {
      body: {
        content: content ?? undefined,
        poll: {
          question: { text: question },
          answers: answers.map(a => ({
            poll_media: {
              text: a.text,
              emoji: a.emojiId ? { id: a.emojiId } : a.emojiName ? { name: a.emojiName } : undefined,
            },
          })),
          duration,
          allow_multiselect: allowMultiselect,
          layout_type: layoutType,
        },
      },
    });
  }

  async expire(channelId, messageId) {
    return this._rest.request('POST', `/channels/${channelId}/polls/${messageId}/expire`);
  }

  async getAnswerVoters(channelId, messageId, answerId, query = {}) {
    const params = new URLSearchParams();
    if (query.after) params.set('after', query.after);
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/channels/${channelId}/polls/${messageId}/answers/${answerId}${qs}`);
  }
}
