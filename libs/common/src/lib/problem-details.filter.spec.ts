import { problem } from './problem-details.filter';

describe('problem helper', () => {
  it('builds RFC 9457-shaped payload', () => {
    expect(problem(400, 'Bad Request', 'invalid field', { code: 'VALIDATION' })).toEqual({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'invalid field',
      code: 'VALIDATION',
    });
  });
});
