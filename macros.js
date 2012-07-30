(define read (get :read (require "./reader.js"))
        compile (get :compile (require "./compiler.js"))
        format (get :format (require "util")))

(define *context* (list {}))

(define (create-context? expr)
 (eq? (car expr) "define"))

(define (add-to-context expr)
  (let ((symbol (get 1 expr))
        (value (.slice expr 2)))
    (console.log "ADDING" symbol "=" (walk-code value) "TO CONTEXT!")
    expr))

(define (is-macroexpand? expr) false)

(define (expand-macro expr)
  (console.log "EXPANDING" expr "AS A MACRO!"))

(define (walk-code ast)
  (console.log (format "AST: %j" ast))
  ;; lets get to the thing!
  (let ((expr (car ast)))
   (if (not expr)
     '()
     (cons (walk-code (cdr ast))
       (cond
         ((create-context? expr) (add-to-context expr))
         ((is-macroexpand? expr) (expand-macro expr))
         (else expr))))))

(let ((read-file (get :readFile (require "fs"))))
  (read-file (get 3 process.argv)
             "utf-8"
             (lambda (err data)
              (if err
                (console.log err)
                (console.log
                (format "\nRESULT: %j"
                        (walk-code (read data))))))))
