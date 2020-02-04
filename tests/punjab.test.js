const { ensure, check, policyScope, PolicyNotAuthorizedError } = require('../src/index');
const ApplicationPolicy = require('../templates/applicationPolicy');

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

  canUpdateWithPromise() {
    return (
      new Promise((resolve) => {
        resolve(this.user.id === this.record.AuthorId)
      })
    );
  }
}

PostPolicy.Scope = class extends ApplicationPolicy.Scope {
  resolve() {
    return {
      ...this.scope,
      data: this.scope.data.filter((item) => item.AuthorId === this.user.id)
    }
  }
}

describe('ensure()', () => {
  it('signed in users can index', () => {
    expect(() => {
      ensure({ id: 1 }, { policy: PostPolicy }, 'canIndex');
    }).not.toThrow();
  })

  it('null users cannot index', () => {
    expect(() => {
      ensure(null, { constructor: { policy: PostPolicy } }, 'canIndex');
    }).toThrow(PolicyNotAuthorizedError);
  });

  it('author can update post', () => {
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate');
     }).not.toThrow();
   });

  it('other users cannot update post', () => {
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 2 }, 'canUpdate');
    }).toThrow(PolicyNotAuthorizedError);
  });

  it('author can update post depending on an external parameter', () => {
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate');
   }).not.toThrow();
    expect(() => {
      ensure({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate', true);
    }).toThrow(PolicyNotAuthorizedError);
  });
})


describe('check()', () => {
  it('signed in users can index', () => {
    expect(
      check({ id: 1 }, { policy: PostPolicy }, 'canIndex')
    ).toBe(true)
  })

  it('null users cannot index', () => {
    expect(
      check(null, { constructor: { policy: PostPolicy } }, 'canIndex')
    ).toBe(false);
  });

  it('author can update post', () => {
    expect(
      check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate')
    ).toBe(true);
  });

  it('other users cannot update post', () => {
    expect(
      check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 2 }, 'canUpdate')
    ).toBe(false);
  });

  it('author can update post depending on an external parameter', () => {
    expect(
      check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate')
    ).toBe(true);
    expect(
      check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdate', true)
    ).toBe(false)
  });

  it('support async error', async () => {
    expect(
      await check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 2 }, 'canUpdateWithPromise')
    ).toBe(false)
  });

  it('support async success', async () => {
    expect(
      await check({ id: 1 }, { constructor: { policy: PostPolicy }, AuthorId: 1 }, 'canUpdateWithPromise')
    ).toBe(true);
  });
});

describe("scopes", () => {
  it('filters out results', () => {
    expect(
      policyScope(
        { id: 1 },
        {
          policy: PostPolicy,
          data: [
            { AuthorId: 1 },
            { AuthorId: 2 },
            { AuthorId: 3 },
            { AuthorId: 1 },
            { AuthorId: 2 },
            { AuthorId: 3 },
          ]
        }
      ).data
    ).toEqual([{"AuthorId": 1}, {"AuthorId": 1}])
  });
});

