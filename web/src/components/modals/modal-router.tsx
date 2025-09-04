"use client";

import { Dialog } from "@/components/ui/dialog";
import { SearchModal } from "./search-modal";
import { CommandDialog } from "../ui/command";
import useKeybind from "@/hooks/use-keybind";
import { Modals } from "@/lib/enums";
import { useModalState } from "@/hooks/nuqs/use-modal-state";

const modalComponents: Record<Modals, React.FC> = {
  [Modals.SEARCH]: SearchModal,
  [Modals.NOTIFICATIONS]: SearchModal,
  [Modals.FIELD_TRANSFORMATION]: SearchModal,
  [Modals.TRANSFORMATION_RULE]: SearchModal,
};

export function ModalRouter() {
  const [modal, setModal] = useModalState();

  useKeybind(["ctrl", "k"], () => {
    setModal((prev) => (prev === Modals.SEARCH ? null : Modals.SEARCH));
  });

  if (!modal) return null;

  const ModalComponent = modalComponents[modal];

  const Slot = modal === Modals.SEARCH ? CommandDialog : Dialog;

  return (
    <Slot open={!!modal} onOpenChange={(open) => setModal(open ? modal : null)}>
      <ModalComponent />
    </Slot>
  );
}
