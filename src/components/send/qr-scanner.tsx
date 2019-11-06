import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

// @ts-ignore
import QrReader from 'react-qr-reader';
import { ToastContainer, toast } from 'react-toastify';

type QrScannerProps = {
  onCodeRead: (code: string) => void;
};

export default function QrScanner({ onCodeRead }: QrScannerProps) {
  const [modal, setModal] = useState(false);
  const toggle = () => setModal(!modal);

  return (
    <div>
      <Button color="primary" onClick={toggle} className="scan-button">
        <i className="far fa-camera-alt" />
      </Button>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalBody style={{ padding: 0 }}>
          <ToastContainer />
          <QrReader delay={300} onError={handleError} onScan={handleScan} style={{ width: '100%' }} />
          <Button color="danger" onClick={toggle} style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', zIndex: 1000 }}>
            Cancel
          </Button>
        </ModalBody>
      </Modal>
    </div>
  );

  function handleError(error: any) {
    console.error(error);
  }

  function handleScan(data: any) {
    if (data) {
      toast('Captured!', { autoClose: 2000 });
      onCodeRead(data.substring(8));
      toggle();
    }
  }
}
