(define read (get :read (require "./reader.js"))
        compile (get :compile (require "./compiler.js"))
        format (get :format (require "util")))

;; Inspect and modify scope

(define (create-scope? expr)
 (case (car expr)
  (("define" "let") true)
  (else false)))

(define (add-to-scope expr scope)
  (case (car expr)
    ("define" (add-define-to-scope expr scope))
    ("let" (add-let-to-scope expr scope)))
  expr)

(define (add-symbol-to-scope symbol value scope)
  (let ((current-scope (car scope)))
    (console.log "** ADDING" symbol "=" (compile value) "TO SCOPE!")
    (set! (get symbol current-scope) value)
    (console.log (format "SCOPE SO FAR: %j" scope))))

(define (add-define-to-scope expr scope)
  (let ((symbol (cadr expr))
        (value (walk-code (.slice expr 2))))
    (add-symbol-to-scope symbol (car value) scope)))

(define (add-let-to-scope expr scope)
  (let ((definitions (cadr expr))
        (body (.slice expr 2))
        ;; create new scope!
        (new-scope (cons {} scope)))
    (map (lambda (pair)
           (let ((symbol (car pair))
                 (value (walk-code (cdr pair))))
             (add-symbol-to-scope symbol (car value) new-scope)))
         definitions)
    (walk-code body new-scope)))

;; Macro expansion

(define (is-macroexpand? expr) false)

(define (expand-macro expr)
  (console.log "EXPANDING" expr "AS A MACRO!"))

(define (walk-code ast (scope (list {})))
  (console.log (format "AST: %j" ast))
  ;; lets get to the thing!
  (let ((expr (car ast)))
   (if (not expr)
     '()
     (let ((next (cond
                   ((create-scope? expr) (add-to-scope expr scope))
                   ((is-macroexpand? expr) (expand-macro expr scope))
                   (else expr))))
       (cons next (walk-code (cdr ast) scope))))))

;; Just for testing (for now)

(let ((read-file (get :readFile (require "fs"))))
  (read-file (get 3 process.argv)
             "utf-8"
             (lambda (err data)
               (if err
                 (console.log err)
                 (console.log
                 (format "\nRESULT: %j" (walk-code (read data))))))))
