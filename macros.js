(define read (get :read (require "./reader.js"))
        compile (get :compile (require "./compiler.js")))

(define *context* (list {}))

(define (walk-code ast)
  (console.log ast)
  ;; lets get to the thing!
  (let ((expr (car ast)))
    (cond
      ((create-context expr) (add-to-context expr))
      ((is-macroexpand expr) (expand-macro expr))
      (else expr))))

(let ((read-file (get :readFile (require "fs"))))
  (read-file (get 3 process.argv)
             "utf-8"
             (lambda (err data)
              (if err
                (console.log err)
                (walk-code (read data))))))
