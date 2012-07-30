(define read (get :read (require "./reader.js"))
        compile (get :compile (require "./compiler.js")))

(define *context* (list {}))

(define (expand-macros ast)
  (console.log ast)
  ;; lets get to the thing!
)

(let ((read-file (get :readFile (require "fs"))))
  (read-file (get 3 process.argv)
             "utf-8"
             (lambda (err data)
              (if err
                (console.log err)
                (expand-macros (read data))))))
