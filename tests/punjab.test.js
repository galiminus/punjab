const { ensure, PolicyNotAuthorizedError } = require('../src/index');
const ApplicationPolicy = require('../../../templates/applicationPolicy');

class PostPolicy extends ApplicationPolicy {
  canIndex() {
    return (
      !!this.user
    );
  }

  canUpdate(forceFail) {
    if (forceFail) {
      return (false);
    }

    return (
      this.user.id === this.record.AuthorId
    );
  }
}

describe('ensure()', () => {
  it('signed in users can index', () => {
    ensure({ id: 1 }, { policy: PostPolicy }, 'canIndex');
  })

  it('null users cannot index', () => {
    expect(() => {
      ensure(null, { constructor: { policy: PostPolicy } }, 'canIndex');
    }).toThrow(PolicyNotAuthorizedError);
  });

  it('author can update post', () => {
    ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate');
  });

  it('other users cannot update post', () => {
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 2 }, 'canUpdate');
    }).toThrow(PolicyNotAuthorizedError);
  });

  it('author can update post depending on an external parameter', () => {
    ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate');
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate', true);
    }).toThrow(PolicyNotAuthorizedError);
  });
})

