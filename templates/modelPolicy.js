const ApplicationPolicy = require('./ApplicationPolicy');

class __MODEL_NAME__Policy extends ApplicationPolicy {
  canIndex() {
    return (
      false
    );
  }

  canShow() {
    return (
      false
    );
  }

  canUpdate() {
    return (
      false
    );
  }

  canCreate() {
    return (
      false
    );
  }

  canDestroy() {
    return (
      false
    );
  }
}

__MODEL_NAME__Policy.Scope = class extends ApplicationPolicy.Scope {
  resolve() {
    return (
      this.scope
    );
  }
}

module.exports = __MODEL_NAME__Policy;
