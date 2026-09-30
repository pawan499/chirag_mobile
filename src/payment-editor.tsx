import { FormSection } from './form-layout';
import { IconButton } from './icon-button';
import { Pencil } from 'lucide-react-native';
import { KeyboardScrollView } from './keyboard-scroll';
import { usePopupController } from './popup';
import React, { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { request } from './api';
import { Data, money } from './domain';
import { Button, Choice, ErrorBox, Field, styles, Title } from './ui';
import { paymentTime } from './payment-time';
export { paymentTime } from './payment-time';
export function PaymentEditor({
  payment,
  onSaved,
  compact = false,
  showHistory = true,
}: {
  compact?: boolean;
  showHistory?: boolean;
  payment: Data;
  onSaved: () => void;
}) {
  const {
    show: showPopup,
    popup,
    cancel,
    isOpen: popupOpen,
  } = usePopupController(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState(payment.paymentMethod);
  const [reference, setReference] = useState(payment.referenceNumber || '');
  const [notes, setNotes] = useState(payment.notes || '');
  const [editNote, setEditNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    String(payment.paymentDate).slice(0, 10),
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await request(`/payments/${payment._id}`, 'PATCH', {
        amount: Number(amount),
        paymentMethod: method,
        referenceNumber: reference,
        notes,
        editNote: editNote.trim(),
        ...(paymentDate !== String(payment.paymentDate).slice(0, 10)
          ? { paymentDate }
          : {}),
      });
      setOpen(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update payment');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const EditButton = compact ? IconButton : Button;
  return (
    <View style={{ gap: 10 }}>
      {showHistory && payment.editedAt && (
        <Text style={styles.heading}>
          Edited · {paymentTime(payment.editedAt)} IST
        </Text>
      )}
      {showHistory &&
        payment.editHistory?.map((edit: Data, i: number) => (
          <Text key={i} style={styles.muted}>
            {paymentTime(edit.editedAt)} IST — {edit.note}
          </Text>
        ))}
      <EditButton
        icon={Pencil}
        secondary
        title="Edit payment"
        onPress={() => {
          setAmount(String(payment.amount));
          setMethod(payment.paymentMethod);
          setReference(payment.referenceNumber || '');
          setNotes(payment.notes || '');
          setEditNote('');
          setPaymentDate(String(payment.paymentDate).slice(0, 10));
          setError('');
          setOpen(true);
        }}
      />
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => {
          if (popupOpen) cancel();
          else if (!busy) setOpen(false);
        }}
      >
        <SafeAreaView style={styles.page}>
          <KeyboardScrollView
            accessibilityElementsHidden={popupOpen}
            importantForAccessibility={
              popupOpen ? 'no-hide-descendants' : 'auto'
            }
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.content}
          >
            <Title sub={payment.paymentId}>Edit payment</Title>
            <FormSection
              title="Payment details"
              subtitle="Update the recorded transaction"
            >
              <Field
                title="Amount (₹)"
                numeric
                value={amount}
                onChange={setAmount}
                editable={!busy}
              />
              <Choice
                title="Payment method"
                disabled={busy}
                value={method}
                options={['CASH', 'UPI', 'CARD', 'OTHER']}
                onChange={setMethod}
              />
              <Field
                title="Payment date (YYYY-MM-DD)"
                value={paymentDate}
                onChange={setPaymentDate}
                editable={!busy}
              />
              <Field
                title="Reference number"
                value={reference}
                onChange={setReference}
                maxLength={200}
                editable={!busy}
              />
              <Field
                title="Payment notes"
                multiline
                value={notes}
                onChange={setNotes}
                maxLength={1000}
                editable={!busy}
              />
            </FormSection>
            <FormSection
              title="Reason for change"
              subtitle="Required for the payment audit history"
            >
              <Field
                title="Reason for editing *"
                multiline
                value={editNote}
                onChange={setEditNote}
                maxLength={2000}
                editable={!busy}
              />
            </FormSection>
            <ErrorBox message={error} />
            <Button
              title={busy ? 'Saving…' : 'Save payment changes'}
              disabled={busy}
              onPress={() => {
                if (!editNote.trim()) {
                  setError('Please enter a reason for editing.');
                  return;
                }
                if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
                  setError('Enter a valid positive amount.');
                  return;
                }
                showPopup(
                  'Save payment changes?',
                  `${payment.paymentId} · ${money(
                    Number(amount),
                  )}\nReason: ${editNote.trim()}`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save changes', onPress: () => void save() },
                  ],
                );
              }}
            />
            <Button
              secondary
              title="Cancel"
              disabled={busy}
              onPress={() => setOpen(false)}
            />
          </KeyboardScrollView>
          {popup}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
