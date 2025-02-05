open LibASL_stage0
open Asl_utils
open Js_of_ocaml

let init input out err =
  Js_of_ocaml.Sys_js.set_channel_flusher stdout out;
  Js_of_ocaml.Sys_js.set_channel_flusher stderr err;
  Js_of_ocaml.Sys_js.set_channel_filler stdin input;
  ()

let dis (opcode: string) : unit =
  let op = Z.of_string opcode in
  let bv = Primops.prim_cvt_int_bits (Z.of_int 32) op in
  let stmts = OfflineASL.Offline.run bv in
  List.iter (fun x -> print_endline (pp_stmt x)) stmts;
  flush stdout

(*
import("offline_js.bc.js");
offlineLifter.dis(opcode);
*)

let () = Js.export "aslp_offline"
  begin object%js
    method init (out : string -> unit) (err : string -> unit) =
      Printexc.record_backtrace true;
      init (fun () -> "") out err
    method formatException (exn : exn) = Printexc.to_string exn
    method printException (exn : exn) = output_string stderr (Printexc.to_string exn)

    method dis x = dis (Js.to_string x)
  end end
