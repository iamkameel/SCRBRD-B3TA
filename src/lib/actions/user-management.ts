
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { getPerson } from './players';
import { revalidatePath } from 'next/cache';
import { getUserId } from '@/lib/server-auth';
import { logAuditEvent } from './audit';

const checkRoleManagementPermission = async (adminId: string, targetUserId: string) => {
    const [admin, target] = await Promise.all([getPerson(adminId), getPerson(targetUserId)]);
    if (!admin) {
        throw new Error("Your user profile could not be found.");
    }
    
    const isAdmin = admin.roles.some(r => ['Admin', 'System Architect'].includes(r));
    if (!isAdmin) {
        throw new Error("You do not have permission to manage user roles.");
    }
    
    // Prevent a non-System-Architect from modifying an Admin or Architect
    if (!admin.roles.includes('System Architect') && target?.roles.some(r => ['Admin', 'System Architect'].includes(r))) {
        throw new Error("You do not have permission to modify this user's roles.");
    }
};

export async function addRoleToUserAction(targetUserId: string, role: string) {
    const adminId = await getUserId();
    if (!adminId) throw new Error("User not authenticated.");
    await checkRoleManagementPermission(adminId, targetUserId);

    const userRef = doc(db, 'people', targetUserId);
    await updateDoc(userRef, {
        roles: arrayUnion(role)
    });
    
    const person = await getPerson(targetUserId);
    await logAuditEvent({
        actorId: adminId,
        action: 'user.role.add',
        target: { type: 'Person', id: targetUserId, name: `\${person?.firstName} \${person?.lastName}`},
        details: { roleAdded: role }
    });
    
    revalidatePath('/user-management');
}

export async function removeRoleFromUserAction(targetUserId: string, role: string) {
    const adminId = await getUserId();
    if (!adminId) throw new Error("User not authenticated.");
    await checkRoleManagementPermission(adminId, targetUserId);

    const userRef = doc(db, 'people', targetUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().roles.length === 1) {
        throw new Error("Cannot remove the last role from a user. Assign a new role first.");
    }

    const currentRoles: string[] = userSnap.data()?.roles || [];
    const activeRole = userSnap.data()?.activeRole;

    const newRoles = currentRoles.filter(r => r !== role);
    let newActiveRole = activeRole;

    // If the active role was the one removed, set a new active role
    if (activeRole === role) {
        newActiveRole = newRoles.length > 0 ? newRoles[0] : undefined;
    }

    await updateDoc(userRef, {
        roles: arrayRemove(role),
        activeRole: newActiveRole,
    });

    const person = await getPerson(targetUserId);
    await logAuditEvent({
        actorId: adminId,
        action: 'user.role.remove',
        target: { type: 'Person', id: targetUserId, name: `\${person?.firstName} \${person?.lastName}`},
        details: { roleRemoved: role }
    });
    
    revalidatePath('/user-management');
}

    