
type tenv = LibASL.Tcheck.GlobalEnv.t
type marshal_env = LibASL.Eval.Env.t * tenv

type js_uint8Array = Js_of_ocaml.Typed_array.uint8Array Js_of_ocaml.Js.t

let marshal (env : marshal_env) : js_uint8Array =
  let bytes = Marshal.to_bytes env [] in
  let len = Bytes.length bytes in
  let array = Bigarray.(Array1.init Int8_unsigned C_layout len (Bytes.get_uint8 bytes)) in
  let genarray = Bigarray.genarray_of_array1 array in
  Js_of_ocaml.Typed_array.from_genarray Js_of_ocaml.Typed_array.Int8_unsigned genarray

let unmarshal (js : js_uint8Array) : marshal_env =
  let genarray = Js_of_ocaml.Typed_array.to_genarray js in
  let array = Bigarray.array1_of_genarray genarray in
  let len = Bigarray.Array1.dim array in
  let bytes = Bytes.init len (fun x -> char_of_int @@ Bigarray.Array1.get array x) in
  Marshal.from_bytes bytes 0

