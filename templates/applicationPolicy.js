class ApplicationPolicy {
  constructor(user, record) {
    this.user = user;
    this.record = record;
  }

  canIndex() {
    return false;
  }

  canShow() {
    return false;
  }

  canUpdate() {
    return false;
  }

  canCreate() {
    return false;
  }

  canDestroy() {
    return false;
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
