# Punjab

Punjab is a simple, robust and scalable authorization library for Node.JS, it is heavily inspired by [pundit](https://github.com/varvet/pundit). Most of this documentation was actually taken from Pundit and adapted for Node.

* *Punjab* is just a small collection of helpers that helps enforcing a security model.
* It ships with a base policy class that you are free to update, or not use at all.
* Helpers are tied to Sequelize models, but you are also free to not use them.

## Installation

```sh
npm install --save pundjab

# Or
yarn add punjab
```

Optionally, you can run the generator, which will set up an application policy with some useful defaults for you:

```sh
npx punjab install
```

## Policies

Punjab is focused around the notion of policy classes. We suggest that you put these classes in `policies/`. This is a simple example that allows updating a post if the user is an admin, or if the post is unpublished:

```javascript
class PostPolicy {
  constructor(user, post) {
    this.user = user;
    this.post = post;
  }

  canUpdate() {
    this.user.isAdmin || !this.post.published?
  }
}
```

As you can see, this is just a plain Javascript class. Punjab makes the following assumptions about this class:

* The first argument is a user.
* The second argument is some kind of model object, whose authorization you want to check. This does not need to be an Sequelize object, it can be anything really.
* The class implements some kind of query method, in this case `canUpdate()`. Usually, this will map to the name of a particular controller action.

That's it really.

Usually you'll want to inherit from the application policy created by the generator, or set up your own base class to inherit from:

```javascript
const ApplicationPolicy = require('./ApplicationPolicy');

class PostPolicy extends ApplicationPolicy {
  canUpdate() {
    this.user.isAdmin || !this.record.published?
  }
}
```

In the generated `ApplicationPolicy`, the model object is called `record`.

Unlike the Ruby Pundit gem, *Punjab* doesn't infer the name of the policy from the record model name, so you must manually link your Sequelize models to its policy:


```javascript
'use strict';

const PostPolicy = require('../policies/postPolicy');

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    title: DataTypes.STRING,
    body: DataTypes.STRING,
  }, {});

  Post.associate = function({ Post, Author }) {
    Post.belongsTo(Author);
  };

  Post.policy = PostPolicy; // <- Right here

  return Post;
};
```

Supposing that you have an instance of this class Post, Punjab now lets you do this in your controller or request handler:

```javascript
const { Post } = require('./models');
const { ensure } = require('punjab');

const app = Express()
  .put('/posts/:id', async (req, res) => {
    const post = await Post.findByPk(req.params.id);

    ensure(req.user, post, 'canUpdate', 'someOptionalParameter');

    res.send(post);
  })
  .listen(3000);
```

The `ensure` method infers that `post` will have a linked PostPolicy class, and instantiates this class, handing in the given user and record. It then calls the `canUpdate` method and throw a `PolicyNotAuthorizedError` in case this method returns `false`. In this case, you can imagine that authorize would have done something like this:

```javascript
const { PolicyNotAuthorizedError } = require('punjab');
const PostPolicy = require('./policies/PostPolicy');

const postPolicy = new PostPolicy.new(req.user, post);
if (!postPolicy.canUpdate('someOptionalParameter')) {
  throw new PolicyNotAuthorizedError;
}
```

Sometimes you don't want to throw errors, or you want to throw other kinds of errors, Punjab offers some less opiniated helpers to give you more control:

`check` is just like `ensure`, except it doesn't throw exceptions and just returns a boolean.

```javascript
const { check } = require('punjab');

[...]

if (!check(req.user, post, 'canUpdate')) {
  // Handle policy check failure
}
```

`policy` is even simpler and just instantiate the policy class for you so can call the policy methods directly:


```javascript
const { policy } = require('punjab');

[...]

if (!policy(req.user, post).canUpdate()) {
  // Handle policy check failure
}
```

Policies methods like `canIndex()` may be tricky to handle since you don't have a specific model instance to check, in that case you can pass the model class:

### Policy

```javascript
const ApplicationPolicy = require('./ApplicationPolicy');

class PostPolicy extends ApplicationPolicy {
  canIndex() {
    return (
      this.user.isAdmin
    );
  }
}
```

### Controller

```javascript
const { Post } = require('./models');
const { ensure } = require('punjab');

const app = Express()
  .put('/posts', async (req, res) => {
    ensure(req.user, Post, 'canIndex');

    const posts = await Post.findAll();

    res.send(posts);
  })
  .listen(3000);
```

## Bare objects

*Punjab* is not tightly tied to *Sequelize*, remember that it's just classes and a few helpers, you can actually use it with any objects:

```javascript
const policy = new PostPolicy({ id: 1 }, { AuthorId: 1 });
if (!policy.canUpdate()) {
  // handle failed check
}
```

You can also use the *Punjab* helpers as long as the `record` object has a `policy` or a `constructor.policy` attribute:

```javascript
const PostPolicy = require('./policies/PostPolicy');

const myCustomPost = {
  AuthorId: 1
  title: "My custom post",
  body: "Lorem ipsum...",

  policy: PostPolicy, // this part is important for ensure(), check() and policy() to work
}

const myCustomUser = {
  id: 1,
  name: "Jack London"
}


ensure(myCustomUser, myCustomPost, 'canUpdate');
```

## Scopes

Often, you will want to have some kind of view listing records which a particular user has access to. When using *Punjab*, you are expected to define a class called a policy scope. It can look something like this:

```javascript
const ApplicationPolicy = require('./ApplicationPolicy');

class PostPolicy extends ApplicationPolicy {
  show() {
    return (this.user.id == this.record.AuthorId)
  }
}

PostPolicy.Scope = class {
  constructor(user, scope) {
    this.user = user;
    this.scope = scope;
  }

  resolve() {
    return this.scope.scope({ where: { AuthorId: this.user.id } })
  }
}

module.exports = PostPolicy;
```

Punjab makes the following assumptions about this class:

* The class has the name Scope and is nested under the policy class.
* The first argument is a user.
* The second argument is a scope of some kind on which to perform some kind of query. It will usually be an Sequelize class, but it could be something else entirely.

Instances of this class respond to the method `resolve()`, which should return some kind of result which can be iterated over.

You'll probably want to inherit from the application policy scope generated by the generator, or create your own base class to inherit from:

```javascript
const ApplicationPolicy = require('./ApplicationPolicy');

class PostPolicy extends ApplicationPolicy {
  show() {
    return (this.user.id == this.record.AuthorId)
  }
}

PostPolicy.Scope = class extends ApplicationPolicy.Scope {
  resolve() {
    return this.scope.scope({ where: { AuthorId: 1 } })
  }
}

module.exports = PostPolicy;
```

You can now use this class from your controller or query handler via the policyScope method:

```javascript
const Post = require('./models/post');
const { policyScope } = require('punjab');

const app = Express()
  .get('/posts', async (req, res) => {
    const posts = await policyScope(req.user, Post).findAll();

    res.send(posts);
  })
  .listen(process.env.PORT || 3000);
```

You can also use the policy scope directly, note that in that case you won't even use *Punjab* code:

```javascript
const Post = require('./models/post');
const PostPolicy = require('./policies')

const app = Express()
  .get('/posts', async (req, res) => {
    const postPolicy = new PostPolicy(req.user, Post)
    const posts = await postPolicy.resolve().findAll();

    res.send(posts);
  })
  .listen(process.env.PORT || 3000);
```

## Just plain old Javascript

As you can see, *Punjab* doesn't do anything you couldn't have easily done yourself. It's a very small library, it just provides a few neat helpers. Together these give you the power of building a well structured, fully working authorization system without using any special DSLs or funky syntax or anything.

Remember that all of the policy and scope classes are just plain Javascript classes, which means you can use the same mechanisms you always use to DRY things up. Encapsulate a set of permissions into a module and include them in multiple policies. Call some policy method inside another to make some permissions behave the same as others. Inherit from a base set of permissions.

## Generator

Use the supplied generator to generate policies:

```
npx punjab generate Post
```

This will create a `policies/postPolicy.js` file that contains a `PostPolicy` class that inherits from `ApplicationPolicy`.

## Rescuing a denied Authorization in Express

```javascript
const Express = require('express');
const { Post, Author } = require('./models');

const { policy, policyScope, check, ensure, PolicyNotAuthorizedError } = require('punjab');

const errorHandler = function handleAssertionError(error, req, res, next) {
  if (error instanceof PolicyNotAuthorizedError) {
    return res.status(403).json({
      error: 'Not Authorized'
    });
  }
  next(error);
}

const app = Express()
  .get('/posts/:id', async (req, res, next) => {
    try {
      const post = await Post.findByPk(req.params.id);

      ensure(req.author, post, 'show');

      res.send(post);
    } catch (error) {
      next(error);
    }
  })
  .use(errorHandler)
  .listen(process.env.PORT || 3000);
```



