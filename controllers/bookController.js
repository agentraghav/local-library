const Book = require('../models/book');

const Author = require('../models/author');

const BookInstance = require('../models/bookinstance');

const Genre = require('../models/genre');

const { body, validationResult } = require('express-validator');

const async = require('async');

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: 'Available' }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, result) {
      res.render('index', {
        title: 'Local Library Home',
        error: err,
        data: result,
      });
    }
  );
};

// Display All Books

exports.book_list = function (req, res) {
  Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
      if (err) {
        return next(err);
      }
      res.render('book_list', { title: 'Book List', book_list: list_books });
    });
};

// Display Book Details

exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.book == null) {
        var err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }

      res.render('book_detail', {
        title: 'Book title',
        book: result.book,
        book_instances: result.book_instance,
      });
    }
  );
};

// Book Create form on get

exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      res.render('book_form', {
        title: 'Create Book',
        authors: result.authors,
        genres: result.genres,
      });
    }
  );
};

// book create form on POST

exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, result) {
          if (err) {
            return next(err);
          }

          for (let i = 0; i < result.genres.length; i++) {
            if (book.genre.indexOf(result.genres[i]._id) > -1) {
              result.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Create Book',
            authors: result.authors,
            genres: result.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      book.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(book.url);
      });
    }
  },
];

// book delete form on GET

exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id).exec(callback);
      },
      books_bookinstances: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.book === null) {
        res.redirect('/catalog/books');
      }

      res.render('book_delete', {
        title: 'Delete Book',
        book: result.book,
        books_bookinstances: result.books_bookinstances,
      });
    }
  );
};

// Handle book delete on POST

exports.book_delete_post = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.bookid).exec(callback);
      },
      books_bookinstances: function (callback) {
        BookInstance.find({ book: req.params.bookid }).exec(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }

      if (result.books_bookinstances.length > 0) {
        res.render('book_delete', {
          title: 'Delete Book',
          book: result.book,
          books_bookinstances: result.books_bookinstances,
        });
        return;
      } else {
        Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
          if (err) return next(err);
          res.redirect('/catalog/books');
        });
      }
    }
  );
};

// Display book update form on GET

exports.book_update_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, result) {
      if (err) {
        return next(err);
      }
      if (result.book === null) {
        var err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }

      for (
        var all_g_iter = 0;
        all_g_iter < result.genres.length;
        all_g_iter++
      ) {
        for (
          var book_g_iter = 0;
          book_g_iter < result.book.genre.length;
          book_g_iter++
        ) {
          if (
            result.genres[all_g_iter]._id.toString() ===
            result.book.genre[book_g_iter]._id.toString()
          ) {
            result.genres[all_g_iter].checked = 'true';
          }
        }
      }
      res.render('book_form', {
        title: 'Update Book',
        authors: result.authors,
        genres: result.genres,
        book: result.book,
      });
    }
  );
};

// book update on POST

exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty.').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    var book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, result) {
          if (err) {
            return next(err);
          }

          for (let i = 0; i < result.genres.length; i++) {
            if (book.genre.indexOf(result.genres[i]._id) > -1) {
              result.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Update Book',
            authors: result.authors,
            genres: result.genres,
            book: book,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
        if (err) {
          return next(err);
        }

        res.redirect(thebook.url);
      });
    }
  },
];
