let upstream = https://github.com/dfinity/vessel-package-set/releases/download/mo-0.9.7-20230718/package-set.dhall sha256:e53459a66249ed946a86dc8dd26c4988675f4500d7664c0f962ae661e03080dd
let base = https://github.com/internet-computer/base-package-set/releases/download/moc-0.7.4/package-set.dhall sha256:3a20693fc597b96a8c7cf8645fda7a3534d13e5fbda28c00d01f0b7641efe494
let Package =
    { name : Text, version : Text, repo : Text, dependencies : List Text }

let
  -- This is where you can add your own packages to the package-set
  additions =
    [
        { name = "array"
        , version = "v0.2.1"
        , repo = "https://github.com/aviate-labs/array.mo"
        , dependencies = [ "base-0.7.3" ] : List Text
        },
        { name = "uuid"
        , version = "v0.2.1"
        , repo = "https://github.com/aviate-labs/uuid.mo"
        , dependencies = [] : List Text
        },
        { name = "encoding"
        , version = "v0.4.1"
        , repo = "https://github.com/aviate-labs/encoding.mo"
        , dependencies = [ "base-0.7.3", "array" ]
        },
        { name = "io"
        , version = "v0.3.2"
        , repo = "https://github.com/aviate-labs/io.mo"
        , dependencies = [ "base-0.7.3" ]
        },
        { name = "matchers"
        , version = "v1.3.0"
        , repo = "https://github.com/kritzcreek/motoko-matchers"
        , dependencies = [] : List Text
        }
    ] : List Package

let
  {- This is where you can override existing packages in the package-set

     For example, if you wanted to use version `v2.0.0` of the foo library:
     let overrides = [
         { name = "foo"
         , version = "v2.0.0"
         , repo = "https://github.com/bar/foo"
         , dependencies = [] : List Text
         }
     ]
  -}
  overrides =
    [] : List Package

in  upstream # base # additions # overrides
