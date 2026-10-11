import { NextRequest, NextResponse } from 'next/server';
import { requestHasAdminAuth } from '@/lib/admin-auth';
import { revokeSessions, setPin, validatePinFormat, verifyPin } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  if (!requestHasAdminAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPin = typeof body?.currentPin === 'string' ? body.currentPin : '';
  const newPin = typeof body?.newPin === 'string' ? body.newPin : '';
  const confirmPin = typeof body?.confirmPin === 'string' ? body.confirmPin : '';

  if (!(await verifyPin(currentPin))) {
    return NextResponse.json(
      { success: false, error: 'Current PIN is incorrect.' },
      { status: 400 },
    );
  }

  if (newPin !== confirmPin) {
    return NextResponse.json(
      { success: false, error: 'New PIN and confirmation do not match.' },
      { status: 400 },
    );
  }

  const formatError = validatePinFormat(newPin);
  if (formatError) {
    return NextResponse.json({ success: false, error: formatError }, { status: 400 });
  }

  if (await verifyPin(newPin)) {
    return NextResponse.json(
      { success: false, error: 'New PIN must be different from the current PIN.' },
      { status: 400 },
    );
  }

  await setPin(newPin);

  // The PIN changed, so every other existing session is no longer trustworthy.
  const token = request.cookies.get('kaiyo-admin-token')?.value ?? null;
  await revokeSessions({ exceptToken: token });

  return NextResponse.json({
    success: true,
    message: 'PIN updated. Other sessions have been signed out.',
  });
}