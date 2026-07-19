import { redirect } from "next/navigation";
import { listChildrenForParent } from "@/features/children/queries";
import { MyRegistrationsList } from "@/features/registration/components/my-registrations-list";
import { RegistrationForm } from "@/features/registration/components/registration-form";
import {
  getOpenRegistrationForPlayer,
  listRegistrationsForParent,
} from "@/features/registration/queries";
import { ensureAppUser } from "@/lib/auth";
import { CURRENT_REGISTRATION_LABEL } from "@/lib/registration";
import { isParentAccount } from "@/lib/roles";

export default async function RegisterPage() {
  const user = await ensureAppUser();
  if (!isParentAccount(user.roles)) redirect("/dashboard");

  const [children, registrations] = await Promise.all([
    listChildrenForParent(user.id),
    listRegistrationsForParent(user.id),
  ]);

  const childOptions = await Promise.all(
    children.map(async (child) => ({
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      level: child.level,
      registered: Boolean(await getOpenRegistrationForPlayer(child.id)),
    })),
  );

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Register</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {CURRENT_REGISTRATION_LABEL} — submit e-transfer proof for CST to
        approve.
      </p>

      <MyRegistrationsList registrations={registrations} />
      <RegistrationForm childOptions={childOptions} />
    </main>
  );
}
