import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const invitationId = searchParams.get('id');

    if (token) {
      console.log('🔍 Looking up invitation with token:', token);
      
      // Find invitation by token
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('invitationToken', '==', token));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Query results:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        docs: querySnapshot.docs.length
      });
      
      if (querySnapshot.empty) {
        // Try to find any invitations to debug
        const allInvitationsQuery = query(invitationsRef);
        const allInvitationsSnapshot = await getDocs(allInvitationsQuery);
        console.log('🔍 All invitations in database:', allInvitationsSnapshot.docs.map(doc => ({
          id: doc.id,
          token: doc.data().invitationToken,
          athleteEmail: doc.data().athleteEmail,
          status: doc.data().status
        })));
        
        return NextResponse.json(
          { success: false, error: 'Invitation not found or expired' },
          { status: 404 }
        );
      }
      
      const invitationDoc = querySnapshot.docs[0];
      const invitationData = invitationDoc.data();
      
      return NextResponse.json({
        success: true,
        invitation: {
          id: invitationDoc.id,
          ...invitationData,
          createdAt: invitationData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          acceptedAt: invitationData.acceptedAt?.toDate?.()?.toISOString()
        }
      });
    } else if (invitationId) {
      // Get invitation by ID
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        return NextResponse.json(
          { success: false, error: 'Invitation not found' },
          { status: 404 }
        );
      }
      
      const invitationData = invitationDoc.data();
      
      return NextResponse.json({
        success: true,
        invitation: {
          id: invitationDoc.id,
          ...invitationData,
          createdAt: invitationData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          acceptedAt: invitationData.acceptedAt?.toDate?.()?.toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Missing required parameter: token or id' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting invitation with ID:', invitationId);

    // Get invitation first to check if it exists
    const invitationRef = doc(db, 'invitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Delete the invitation
    await deleteDoc(invitationRef);
    
    console.log('✅ Invitation deleted successfully:', invitationId);

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    );
  }
}

