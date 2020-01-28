class ApplicationPolicy {
  constructor(user, record) {
    this.user = user;
    this.record = record;
  }

  index() {
    return (false);
  }

  show() {
    return (false);
  }

  update() {
    return (false);
  }

  create() {
    return (false);
  }

  destroy() {
    return (false);
  }
}

ApplicationPolicy.Scope = class ApplicationPolicyScope {
  constructor(user, scope) {
    this.user = user;
    this.scope = scope;
  }

  resolve() {
    return this.scope;
  }
}

module.exports = ApplicationPolicy;
