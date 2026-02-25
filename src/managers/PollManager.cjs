'use strict';

const { CordXRest } = require('../rest/CordXRest.cjs');
const { CordXError, CordXErrorCode } = require('../errors/CordXError.cjs');

class PollManager {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._rest = new CordXRest(client);
  }

  /**
   * Create a message with a poll. Sends to the channel directly.
   * @param {string} channelId
   * @param {{
   *   question: string,
   *   answers: Array<{ text: string, emojiId?: string, emojiName?: string }>,
   *   duration?: number,
   *   allowMultiselect?: boolean,
   *   layoutType?: number,
   *   content?: string,
   * }} options
   */
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
          question:          { text: question },
          answers:           answers.map(a => ({
            poll_media: {
              text:     a.text,
              emoji:    a.emojiId
                          ? { id: a.emojiId }
                          : a.emojiName
                            ? { name: a.emojiName }
                            : undefined,
            },
          })),
          duration:           duration,
          allow_multiselect: allowMultiselect,
          layout_type:       layoutType,
        },
      },
    });
  }

  /**
   * Immediately expire (end) a poll.
   * @param {string} channelId
   * @param {string} messageId
   */
  async expire(channelId, messageId) {
    return this._rest.request('POST', `/channels/${channelId}/polls/${messageId}/expire`);
  }

  /**
   * Get all users that voted for a specific answer.
   * @param {string} channelId
   * @param {string} messageId
   * @param {number} answerId
   * @param {{ after?: string, limit?: number }} [query]
   */
  async getAnswerVoters(channelId, messageId, answerId, query = {}) {
    const params = new URLSearchParams();
    if (query.after) params.set('after', query.after);
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString() ? `?${params}` : '';
    return this._rest.request('GET', `/channels/${channelId}/polls/${messageId}/answers/${answerId}${qs}`);
  }
}

module.exports = { PollManager };
