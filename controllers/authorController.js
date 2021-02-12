const Author = require('../models/author');

const async = require('async');

const Book = require('../models/book');

const { body, validationResult } = require('express-validator');

const genre = require('../models/genre');

//Display author list

exports.author_list = function (req, res, next) {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }

      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

// Display author details

exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      author_books: function (callback) {
        Book.find({ author: req.params.id }, 'title summary').exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.author === null) {
        var err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }

      res.render('author_detail', {
        author: result.author,
        author_books: result.author_books,
      });
    }
  );
};

// Author Create Form on GET

exports.author_create_get = function (req, res, next) {
  res.render('author_form', { title: 'Create Author' });
};

// Handle Author Create Form on Post request

exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First Name must be specified')
    .isAlphanumeric()
    .withMessage('First Name should not contain Alphanumeric Character'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family Name must be specified')
    .isAlphanumeric()
    .withMessage('Family Name should not contain Alphanumeric Character'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(author.url);
      });
    }
  },
];

// Author delete get

exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },

      author_books: function (callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }

      if (result.author === null) {
        res.redirect('/catalog/authors');
      }

      res.redner('author_delete', {
        title: 'Delete Author',
        author: result.author,
        author_books: result.author_books,
      });
    }
  );
};

// Handle Author delete Post

exports.author_delete_post = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      author_books: function (callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.author_books.length > 0) {
        res.render('author_delete', {
          title: 'Delete Author',
          author: result.author,
          author_books: result.author_books,
        });
        return;
      } else {
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/catalog/authors');
        });
      }
    }
  );
};

// Display Author on update get

exports.author_update_get = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.author === null) {
        var err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }
      res.render('author_form', {
        title: 'Update Author',
        author: result.author,
      });
    }
  );
};

// Handle author update on post

exports.author_update_post = [
  body('first_name', 'First Name must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('family_name', 'Family Name must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('date_of_birth', 'Date of Birth must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Update Form',
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      Author.findByIdAndUpdate(req.params.id, author, {}, function (
        err,
        theauthor
      ) {
        if (err) {
          return next(err);
        }
        res.redirect(theauthor.url);
      });
    }
  },
];
