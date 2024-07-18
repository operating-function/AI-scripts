# GUIDE FOR THE SIRE LANGUAGE

Sire is a minimal functional language based on reflective supercombinators.
It is similar to Lisp in capabilities, but is written in a more Haskell/ML-style
and but has a unusual and extensible syntax, and a much smaller core than all
these languages.

## Sire Core Language

All of Sire compiles itself to PLAN, an untyped supercombinator calculus:

```
Term ::=
  | <Term>         // A hash-node in the merkle-DAG of content-addressable "memory pages", called a pin
  | {Nat Nat Term} // User-defined function, called a law
  | (Term Term)    // Function application, called an "app"
  | Nat            // A natural number, interpreted either as data or a native function
```

It is always legal to write PLAN in Sire, but normally we don't.

## Sire Syntax (Rex)

Sire may compile itself to PLAN, but it uses Rex (R-expressions) to write its code.
Rex is an alternative to Lisp's S-Expressions that provides a much more
flexible syntax while still having a simple, uniform model that's easy to parse.

S-Expressions have a structure that looks something like this:

    name := [a-zA-Z0-9_$!#%&*+,./:<=>?@\\^`|~]+-]+

    exp :=
       | name
       | ()
       | (exp)
       | (exp exp...)

For Example:

    ((+ 3) (+ 3 4))

    (print (* 3 4))

Where R-Expression have a structure that looks something like:

    rune := [$!#%&*+,./:<=>?@\\^`|~-]+
    name := [a-zA-Z0-9_]+

    exp :=
        | name
        | (rune)
        | (rune exp)
        | (rune exp exp...)
        | exp exp

Notice that every (nested expression) must start with a rune, and
expressions may be juxtaposed:

    (+ 3)(+ 4 5)

    print(* 4 5)

The advantage is that this structure can be unambiguously encoded to
text in a large variety of different ways.  There are five different
layouts, and they can be mixed freely.

-   Nested Layout:

        (= x 3)(| print)(| concat msg (| show (* x x)))

-   Open Layout (indentation sensitive):

        = x 3
        | print
        | concat msg
            | show
                * x x

        = x 3
        | print
        | concat msg | show * x x

-   Infix Layout:

        (x = 3)(| print)(concat | msg | (show | (x * x)))

-   Closed Layouts: (nested and |prefix)

        (x=3)(print|(concat|msg)(show|(x*x)))

-   Or any combination:

        = x 3
        | print
        | concat msg (| show x*x)

There is also some syntactic sugar.

-   (no-rune nested expressions) default to `|` rune.

        = x 3
        | print
        (concat msg (show x*x))

-   You can write multiple runes within a () form (which work the same
    was as open-form:

        (x=3)(|print)(| concat msg | show x*x)

All of these different forms parse into the exact same R-expression
structure, which by the way is completely meaningless as Sire!
This is just to explain Rex to you.

Rex gives Sire very expressive syntax, but still gives you all of
the advantages of S-expressions:

-   Very simple parser and printer.
-   Generic parser and pretty-printer that can be shared between languages.
-   Enables traditional Lisp meta-programming (defmacro + syntax-rules).

Here is an example of actual Sire in both Rex and faux S-expressions:

In R-Expressions:

    = (tabToPairs tab)
    @ ks | listFromRow tabKeys-tab
    @ vs | listFromRow tab
    | listToRow (listZip ks vs)

In S-Expressions:

    (define (tab-to-pairs tab)
     (let ((ks (list-from-row (tab-keys tab)))
           (vs (list-from-row tab)))
      (list-to-row (list-zip ks vs))))


The main Rex runes that you need to know are `=`, `|`, `-`, `@`, `&`, `?`, `^`, `:`,
`#`, `!!` and `=?=`.

### Top-Level Function

Every .sire file can have MANY top-level definitions:

```
= (fun0 arg0 arg1)
body

= (fun1 arg0 arg1)
body

const0=body
```

Where:
- fun0, fun1 and const0 are names
- `=` is the top level def rune, similar to `defun` in Lisp.
  This rune is usually written prefix, but for small bodies infix is also acceptable.
- arg0, arg1... are the function arguments
- body is the definition's body
- if the first child of `=` is a parenthesized list longer than 1 element, the definition is a
  function. otherwise it is a constant.

### Function application

Function application is primarily done using the `|` rune:

```
= (fun0 arg0 arg1)
| fun1 arg0 arg1 | fun2 arg0
                 | fun3 arg1
| fun4 arg1
```

Notice the indentation here, since it's semantically important.
The result of `fun3` will be the last argument to `fun2`, while the result
of `fun4` will be the last element to `fun1`.

Since runeless nested expressions default to `|`, this can be equivalently written:

```
= (fun0 arg0 arg1)
(fun1 arg0 arg1 (fun2 arg0 (fun3 arg1)) (fun4 arg1))
```

There is also the `-` rune, which is typically only used infix when you want to
apply a short function name to a single short argument:

```
= (fun0 x y)
| fun1 inc-x y
| fun2 y inc-x
```

Or equivalently:
```
(fun0 x y)=(fun1 (inc x) y (fun2 y (inc x)))
```

### Let bindings

The `@` rune makes a let binding, which can be both a constant and a function:

```
@ x 5
@ (f x) | mul x 10
| add x (f x)
```

### Lambda

Anonymous functions are created using `&`:

```
| foreach xs
& x
(x, (add x 5))
```

Or infix:

```
| foreach xs x&(x, (add x 5))
```

With the `?` rune, ad-hoc functions can also be given names,
if you want them to be recursive:

```
| foreach xs
? (fib x)
| if (lte x 1) x
| add (fib dec-x) (fib | dec dec-x)
```

There's also the `??` rune, which you should never generate but which you might encounter. It works the same way for our purposes.

### Expression reordering

Sometimes it's convenient to place a syntactically large expression further down,
away from the main expression. For this you can use the `^` macro rune. For example:

```
^ (i, (_ i))
? (loop x)
| if (condition x) x
| loop (fun1 x)
```

The `_` hole will be filled with the `loop`-lambda defined by `?`.
So informally, the result is the tuple `(i, (loop i))`. Technically the macro
binds the name `_` to the lower expression, so it can be used many times in
the upper expression.

### Continuation passing style

If the last argument that you want to give to a function is another function
(like a callback or a continuation), you can use the `:` macro rune:

```
: x < foreach xs
(x, (add x 5)
```
Desugars to:

```
| foreach xs
& x
(x, (add x 5))
```

This is especially useful to pattern match on built-in datatypes like `Maybe`
and `List`:

```
: x xs < listCase xs NONE
| SOME x
```

```
: x < maybeCase mx 0
| computeValue x
```

This is also useful for dealing with monadic bind, since we don't have `do`-notation:

```
: x < bindMaybe | SOME 5
: y < bindMaybe | NONE
| SOME (x == y)
```

The above expression returns `NONE`, since `bindMaybe` shortcircuits on `NONE`.

Except for the `:` and `^` macros, most macros start with the `#` rune by convention.
These are mostly used to define datatypes and pattern match on these.

### ADTs

ADTs are defined using `#datatype`:

```
# datatype (Name p0 p1)
* CTR0 (f0 : p0) (f1 : F1) ...
* CTR1 (f0 : F0) (f1 : p1) ...
* ...
```

Where:
- p0, p1... are parameters
- CTR0, CTR1... are constructors
- f0, f1... are fields

### Pattern-Matching

To eliminate a datatype, the `#datacase` syntax can be used:

```
# datacase x
* (CTR0 x0 _)   | fun x0 10
* (CTR1 x0 x1)
  | fun0 x0 ; multiline returns are placed on a new line
  | fun1 x0 x1
  ; required commented line for the block syntax not to break
* (CTR2 x0 x1) |  ret2
  ...
```

Where:
- x is the expression to pattern match on
- CTR0, CTR1... are the matched cases
- x0, x1 are the values in each constructor

### Records

Records are a separate construction from datatypes:

```
# record (Name p0 p1)
| CTR
* f0 : p0
* f1 : F0
* f2 : p1
* f3 : F1
```

Since records only have a single possible case, they can be deconstructed in argument lists (and by extension also in `:`-binds):

```
= (fun (CTR x0 _ x2 _))
| fun0 x0 x2
```

They can also be manipulated with the autogenerated pure functions `getF0` and `setF3` and so on.

### About datatypes and records

Datatype and records desugar to tuples where the first element is a natural number that counts
upwards from zero to distinguish between the constructors. So different datatypes can have identical representations.
Datatypes aren't actually checked, they are just syntactic sugar to allow the
programmer to express their intent and and pattern match more clearly.

### Mutual recursion

If you import the `mutrec` file, the `#mutual` macro allows mutual recursion:

```
:| mutrec

# mutual evenodd
= (isOdd n)
  | if (isZero n) | FALSE
  | isEven (dec n)
;
= (isEven n)
  | or | isZero n
  | isOdd (dec n)
; end mutual evenodd
```

Note the commented line that connects the two definitions! Without it, the
intended `#mutual` block would break into two, causing `isOdd` to not have
`isEven` in scope. Note also that contrary to normal definitions, the body
of each mutual defintion needs to be indented, and we can't have type signatures.
These are shortcomings of the `#mutual` macro which will be fixed in the future.

### Additional syntax

- Rows (arrays):
  - List-like:
    - Closed layout: `[a b c]`
    - Open layout:
      ```
      ++ a
      ++ b
      ++ c
      ```
  - Tuple-like: `(a,b,c)` (semantically idential to list-like rows, use whichever is clearest)
- Chars and strings: `{a}` and `{foo}` (desugars to a natural number)
- Lists: `~[]` or `~[a b c]` (desugars to `NIL` and `CONS`)
  - Open layout:
    ```
    ~~ a
    ~~ b
    ~~ c
    ```
- Tabs (maps/dicts): `#[k0=v0 k1=v1 k2=v2]`
- Bars (bytestrings):
  - Ascii: `b#{hello world}`
  - Hex: `x#{68656C6C6F20776F726C64}` (both of these code for the same bar value)
- Quotes: any Sire code can be quoted using `'`, which gives back the Rex AST:
  ```
  ' | lookup val '(add 5 'x)
  ```
  In the example above, we've quoted: the symbol `x`, the `add`-expression,
  and the bigger `lookup`-expression (that starts with the `|` rune).
- Comments: `; comment here`

### Unit tests

Sire has built-in support for unit tests using `=?=` and `!!`. Use them. Example:

```
(maybeToEither m)=(maybeCase m (LEFT ()) RIGHT) ; The third argument to `maybeCase` is a continuation function.

=?= (LEFT ())     | maybeToEither NONE
=?= (RIGHT 5)     | maybeToEither | SOME 5
=?= (RIGHT {foo}) | maybeToEither | SOME {foo}

!! isEven 6
!! isOdd 7
!! isEven 0

1 =?= fromSome 0 SOME-1
```

## Bootstrapping and dependencies

Sire bootstraps itself from PLAN. It applies each `=` definition in sequence,
building up a computational world. It does this using a sequence of files named
`sire_nn_xxx.sire` where `nn` is the number in the sequence from `01` to `27`
and `xxx` is the chapter name. These chapters are mostly like standard library
modules, but sometimes the dependency chain is such that functions operating
on a datatype must be split into different files. The chapters are:

- `sire_01_fan.sire` - Defines named wrappers around PLAN operations
- `sire_02_bit.sire` - Booleans
- `sire_03_nat.sire` - Natural numbers and operating on them
- `sire_04_cmp.sire` - Comparison, ordering and equality
- `sire_05_row.sire` - Rows and basic operations on them
- ❗ `sire_06_rex.sire` - Representation for rex trees - mostly needed for macros.
- 👍 `sire_07_dat.sire` - Data structures; rows, lists, maybe, either, etc.
- 👍 `sire_10_str.sire` - ASCII characters and strings
- `sire_11_set.sire` - Sets
- 👍 `sire_12_tab.sire` - Tabs
- ❗ `sire_13_exp.sire` - More rex and macro utilities
- ❗ `sire_14_hax.sire` - Explains how the `#` rune is used for macros
- ❗ `sire_15_pad.sire` - Bit-strings encoded as nats
- 👍 `sire_16_bar.sire` - Byte-arrays and operations
- `sire_17_sug.sire` - Syntactic sugar and convenience macros
- ❗ `sire_18_pat.sire` - Pattern matching
- ❗ `sire_19_bst.sire` - Binary search trees
- ❗ `sire_20_prp.sire` - Sire properties
- `sire_21_switch.sire` - Atomic switch
- ❗ `sire_22_seed.sire` - Seed; serialization framework
- ❗ `sire_23_repl.sire` - REPL utilities
- ❗ `sire_24_rex.sire` - Rex
- `sire_25_datatype.sire` - Datacase/Record
- ⁉️ `sire_26_compile.sire` - Backend of the sire compiler
- ⁉️ `sire_27_sire.sire` - Sire-in-sire; can be used to bootstrap itself

Particularly helpful ones for a beginner are annotated with a 👍. Files that require a more advanced understanding and can be skipped for now are annotated with a ❗.

These are imported and rexported by `sire.sire`, which is common to include
at the start of most files:

```
; Copyright 2023 The Plunder Authors
; Use of this source code is governed by a BSD-style license that can be
; found in the LICENSE file.

#### sire <- sire_27_sire

;;;; Re-export everything in the boot-sequence, with the exception
;;;; of internal routines that are imported by some specific modules.

:| sire_01_fan
:| sire_02_bit
:| sire_03_nat
:| sire_05_row
:| sire_04_cmp
:| sire_05_row
:| sire_06_rex
:| sire_07_dat
:| sire_10_str
:| sire_11_set
:| sire_12_tab
:| sire_13_exp
:| sire_14_hax
:| sire_15_pad
:| sire_16_bar
:| sire_17_sug
:| sire_18_pat
:| sire_19_bst
:| sire_20_prp
:| sire_21_switch   [{#switch} dataTag]
:| sire_22_seed     [pinRefs _LoadGerm _SaveGerm _LoadSeed _SaveSeed]
:| sire_23_repl     []
:| sire_24_rex      [simpleCog rexCog listMonoid blockState]
:| sire_25_datatype [{#datatype} {#datacase} {#record} typeTag]
:| sire_25_datatype [TRUE FALSE LEFT RIGHT SOME NONE CONS NIL]
:| sire_26_compile  []
:| sire_27_sire     [main]
```

The `####` rune is not an import, it is a dependency declaration. Every Sire
file only has a single dependency, but that dependency can in turn have
dependencies, all of which we can add to our namespace using `:|`.

At the end of files, you can sometimes see the namespace being filtered using
`^-^`, which works as an export list. Only these names are kept in the environment.
Here are the final lines in `sire_05_row.sire`, the file that deals with
rows (tuples/arrays):

```
;;; Exports ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

^-^
^-^ head last null arity len
^-^ idx get
^-^ mut put
^-^ switch
^-^
^-^ c0 c1 c2 c3 c4 c5 c6 c7 c8 c9
^-^ v0 v1 v2 v3 v4 v5 v6 v7 v8 v9
^-^
^-^ cow isCow cowSize
^-^ isRow
^-^ weld
^-^ gen foldr foldl
^-^ fst snd thr
^-^ map foreach
^-^ rev
^-^ curry uncurry
^-^ rowCons rowSnoc
^-^ rowApply rowRepel
^-^
```


## Sire Examples

### From `sire_07_dat.sire`

```
;;; Lists ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

= NIL           | 0
= (**CONS x xs) | [x xs]

= (**listCase xs nil cons)
| if isNat-xs nil
| **cons idx-0-xs idx-1-xs

;; TODO s/([a-z])Singleton/\1Sing/g

(listSing x)=(CONS x 0)

= (listMap f l)
| listCase l NIL
& (x xs)
| CONS f-x listMap-f-xs

(**listForEach l f)=(listMap f l)

= (listHead l)
| listCase l NONE
& (h _)
| SOME h
```

The preceeding `**` in some definitions means that the function should be inlined.
Never generate this unless explicitly asked to.

### A few Row functions

Generally rows (arrays) are privileged over (linked) lists.
Row functions are named foldr, map and cat,
while list functions are named listFoldr, listMap and listCat. 

#### `gen`

Return a row of n length, generated by passing each index to a function passed.

```
| gen 10 id
```
Generates: `[0 1 2 3 4 5 6 7 8 9]


```
| gen 10 | mul 2
```
Generates: `[0 2 4 6 8 10 12 14 16 18]`

### `map`

Apply a function to all values in a row

```
| map inc [0 1 2 3]
```

### `weld`

Concatenate two rows

```
| weld [1 2] [3 4]
```


## Finding additional standard library functions

The entire "standard library" is defined in the consecutively-numbered `sire/sire_<n>_<name>.sire` files. If you're trying to complete some task and the functions described above don't help, there's a decent chance there's already a function defined in the standard library that will help.
