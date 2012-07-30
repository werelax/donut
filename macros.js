(define read (get :read (require "./reader.js"))
        compile (get :compile (require "./compiler.js"))
        format (get :format (require "util")))

(define *context* (list {}))

;; Inspect and modify context

(define (create-context? expr)
 (case (car expr)
  (("define" "lambda" "let") true)
  (else false)))

(define (add-to-context expr)
  (case (car expr)
    ("define" (add-define-to-context expr))
    ("let" (add-let-to-context expr))
    ("lambda" (add-lambda-to-context expr)))
  expr)

(define (add-symbol-to-context symbol value)
 (let ((current-context (car *context*)))
  (console.log "** ADDING" symbol "=" (compile value) "TO CONTEXT!")
  (set! (get symbol current-context) value)))

(define (add-define-to-context expr)
  (let ((symbol (cadr expr))
        (value (walk-code (.slice expr 2))))
    (add-symbol-to-context symbol (car value))))

(define (add-let-to-context expr)
  (let ((definitions (cadr expr)))
    (map (lambda (pair)
           (let ((symbol (car pair))
                 (value (walk-code (cdr pair))))
             (add-symbol-to-context symbol (car value))))
         definitions)))

(define (add-lambda-to-context expr))

;; Macro expansion

(define (is-macroexpand? expr) false)

(define (expand-macro expr)
  (console.log "EXPANDING" expr "AS A MACRO!"))

(define (walk-code ast)
  (console.log (format "AST: %j" ast))
  ;; lets get to the thing!
  (let ((expr (car ast)))
   (if (not expr)
     '()
     (let ((next (cond
                   ((create-context? expr) (add-to-context expr))
                   ((is-macroexpand? expr) (expand-macro expr))
                   (else expr))))
       (cons next (walk-code (cdr ast)))))))

;; Just for testing (for now)

(let ((read-file (get :readFile (require "fs"))))
  (read-file (get 3 process.argv)
             "utf-8"
             (lambda (err data)
              (if err
                (console.log err)
                (console.log
                (format "\nRESULT: %j \nCONTEXT: %j"
                        (walk-code (read data))
                        *context*))))))
