export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      Attendance: {
        Row: {
          checkInMethod: string
          checkInTime: string
          id: string
          registrationId: string
          sessionId: string | null
          volunteerId: string | null
        }
        Insert: {
          checkInMethod: string
          checkInTime?: string
          id?: string
          registrationId: string
          sessionId?: string | null
          volunteerId?: string | null
        }
        Update: {
          checkInMethod?: string
          checkInTime?: string
          id?: string
          registrationId?: string
          sessionId?: string | null
          volunteerId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Attendance_registration_fkey"
            columns: ["registrationId"]
            isOneToOne: false
            referencedRelation: "Registration"
            referencedColumns: ["id"]
          },
        ]
      }
      BookingMessage: {
        Row: {
          attachments: Json | null
          bookingId: string
          id: string
          message: string
          senderId: string
          senderType: string
          sentAt: string
        }
        Insert: {
          attachments?: Json | null
          bookingId: string
          id?: string
          message: string
          senderId: string
          senderType: string
          sentAt?: string
        }
        Update: {
          attachments?: Json | null
          bookingId?: string
          id?: string
          message?: string
          senderId?: string
          senderType?: string
          sentAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BookingMessage_booking_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "BookingRequest"
            referencedColumns: ["id"]
          },
        ]
      }
      BookingRequest: {
        Row: {
          additionalNotes: string | null
          budgetRange: Json | null
          createdAt: string
          eventId: string
          finalPrice: number | null
          id: string
          organizerId: string
          quotedPrice: number | null
          requirements: string
          serviceDate: string
          serviceListingId: string
          status: Database["public"]["Enums"]["BookingStatus"]
          updatedAt: string
          vendorId: string
        }
        Insert: {
          additionalNotes?: string | null
          budgetRange?: Json | null
          createdAt?: string
          eventId: string
          finalPrice?: number | null
          id?: string
          organizerId: string
          quotedPrice?: number | null
          requirements: string
          serviceDate: string
          serviceListingId: string
          status?: Database["public"]["Enums"]["BookingStatus"]
          updatedAt?: string
          vendorId: string
        }
        Update: {
          additionalNotes?: string | null
          budgetRange?: Json | null
          createdAt?: string
          eventId?: string
          finalPrice?: number | null
          id?: string
          organizerId?: string
          quotedPrice?: number | null
          requirements?: string
          serviceDate?: string
          serviceListingId?: string
          status?: Database["public"]["Enums"]["BookingStatus"]
          updatedAt?: string
          vendorId?: string
        }
        Relationships: [
          {
            foreignKeyName: "BookingRequest_event_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BookingRequest_organizer_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BookingRequest_serviceListing_fkey"
            columns: ["serviceListingId"]
            isOneToOne: false
            referencedRelation: "ServiceListing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BookingRequest_vendor_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "VendorProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      Certificate: {
        Row: {
          certificateId: string
          distributedAt: string | null
          eventId: string
          id: string
          issuedAt: string
          metadata: Json
          pdfUrl: string
          qrCodeUrl: string
          recipientId: string
          type: Database["public"]["Enums"]["CertificateType"]
        }
        Insert: {
          certificateId: string
          distributedAt?: string | null
          eventId: string
          id?: string
          issuedAt?: string
          metadata: Json
          pdfUrl: string
          qrCodeUrl: string
          recipientId: string
          type: Database["public"]["Enums"]["CertificateType"]
        }
        Update: {
          certificateId?: string
          distributedAt?: string | null
          eventId?: string
          id?: string
          issuedAt?: string
          metadata?: Json
          pdfUrl?: string
          qrCodeUrl?: string
          recipientId?: string
          type?: Database["public"]["Enums"]["CertificateType"]
        }
        Relationships: [
          {
            foreignKeyName: "Certificate_event_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Certificate_recipient_fkey"
            columns: ["recipientId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunicationLog: {
        Row: {
          eventId: string
          id: string
          metadata: Json | null
          recipientCount: number
          senderId: string
          sentAt: string
          status: string
          subject: string
        }
        Insert: {
          eventId: string
          id?: string
          metadata?: Json | null
          recipientCount: number
          senderId: string
          sentAt?: string
          status: string
          subject: string
        }
        Update: {
          eventId?: string
          id?: string
          metadata?: Json | null
          recipientCount?: number
          senderId?: string
          sentAt?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunicationLog_event_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunicationLog_sender_fkey"
            columns: ["senderId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Event: {
        Row: {
          branding: Json
          capacity: number | null
          createdAt: string
          description: string
          endDate: string
          id: string
          inviteLink: string | null
          landingPageUrl: string
          leaderboardEnabled: boolean
          mode: Database["public"]["Enums"]["EventMode"]
          name: string
          organizationId: string | null
          organizerId: string
          registrationDeadline: string | null
          startDate: string
          status: Database["public"]["Enums"]["EventStatus"]
          updatedAt: string
          venue: Json | null
          virtualLinks: Json | null
          visibility: Database["public"]["Enums"]["EventVisibility"]
        }
        Insert: {
          branding: Json
          capacity?: number | null
          createdAt?: string
          description: string
          endDate: string
          id?: string
          inviteLink?: string | null
          landingPageUrl: string
          leaderboardEnabled?: boolean
          mode: Database["public"]["Enums"]["EventMode"]
          name: string
          organizationId?: string | null
          organizerId: string
          registrationDeadline?: string | null
          startDate: string
          status?: Database["public"]["Enums"]["EventStatus"]
          updatedAt?: string
          venue?: Json | null
          virtualLinks?: Json | null
          visibility?: Database["public"]["Enums"]["EventVisibility"]
        }
        Update: {
          branding?: Json
          capacity?: number | null
          createdAt?: string
          description?: string
          endDate?: string
          id?: string
          inviteLink?: string | null
          landingPageUrl?: string
          leaderboardEnabled?: boolean
          mode?: Database["public"]["Enums"]["EventMode"]
          name?: string
          organizationId?: string | null
          organizerId?: string
          registrationDeadline?: string | null
          startDate?: string
          status?: Database["public"]["Enums"]["EventStatus"]
          updatedAt?: string
          venue?: Json | null
          virtualLinks?: Json | null
          visibility?: Database["public"]["Enums"]["EventVisibility"]
        }
        Relationships: [
          {
            foreignKeyName: "Event_organization_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Event_organizer_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      EventTimelineItem: {
        Row: {
          bookingId: string | null
          category: string
          createdAt: string
          deliverableId: string | null
          description: string
          dueDate: string
          eventId: string
          id: string
          serviceDate: string | null
          status: string
          title: string
          updatedAt: string
          vendorId: string | null
        }
        Insert: {
          bookingId?: string | null
          category: string
          createdAt?: string
          deliverableId?: string | null
          description: string
          dueDate: string
          eventId: string
          id?: string
          serviceDate?: string | null
          status: string
          title: string
          updatedAt?: string
          vendorId?: string | null
        }
        Update: {
          bookingId?: string | null
          category?: string
          createdAt?: string
          deliverableId?: string | null
          description?: string
          dueDate?: string
          eventId?: string
          id?: string
          serviceDate?: string | null
          status?: string
          title?: string
          updatedAt?: string
          vendorId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "EventTimelineItem_booking_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "BookingRequest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EventTimelineItem_event_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EventTimelineItem_vendor_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "VendorProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      Follow: {
        Row: {
          followedAt: string
          id: string
          organizationId: string
          userId: string
        }
        Insert: {
          followedAt?: string
          id?: string
          organizationId: string
          userId: string
        }
        Update: {
          followedAt?: string
          id?: string
          organizationId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Follow_organization_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Follow_user_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Organization: {
        Row: {
          branding: Json
          category: Database["public"]["Enums"]["OrganizationCategory"]
          createdAt: string
          description: string
          followerCount: number
          id: string
          name: string
          pageUrl: string
          rejectionReason: string | null
          socialLinks: Json | null
          updatedAt: string
          verificationStatus: Database["public"]["Enums"]["VerificationStatus"]
        }
        Insert: {
          branding: Json
          category: Database["public"]["Enums"]["OrganizationCategory"]
          createdAt?: string
          description: string
          followerCount?: number
          id?: string
          name: string
          pageUrl: string
          rejectionReason?: string | null
          socialLinks?: Json | null
          updatedAt?: string
          verificationStatus?: Database["public"]["Enums"]["VerificationStatus"]
        }
        Update: {
          branding?: Json
          category?: Database["public"]["Enums"]["OrganizationCategory"]
          createdAt?: string
          description?: string
          followerCount?: number
          id?: string
          name?: string
          pageUrl?: string
          rejectionReason?: string | null
          socialLinks?: Json | null
          updatedAt?: string
          verificationStatus?: Database["public"]["Enums"]["VerificationStatus"]
        }
        Relationships: []
      }
      OrganizationAdmin: {
        Row: {
          addedAt: string
          id: string
          organizationId: string
          role: string
          userId: string
        }
        Insert: {
          addedAt?: string
          id?: string
          organizationId: string
          role?: string
          userId: string
        }
        Update: {
          addedAt?: string
          id?: string
          organizationId?: string
          role?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "OrganizationAdmin_organization_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "Organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrganizationAdmin_user_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      PaymentRecord: {
        Row: {
          amount: number
          bookingId: string
          createdAt: string
          currency: string
          id: string
          payeeId: string
          payerId: string
          paymentMethod: Json
          platformFee: number
          processedAt: string | null
          status: Database["public"]["Enums"]["PaymentStatus"]
          transactionId: string | null
          vendorPayout: number
        }
        Insert: {
          amount: number
          bookingId: string
          createdAt?: string
          currency?: string
          id?: string
          payeeId: string
          payerId: string
          paymentMethod: Json
          platformFee: number
          processedAt?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
          transactionId?: string | null
          vendorPayout: number
        }
        Update: {
          amount?: number
          bookingId?: string
          createdAt?: string
          currency?: string
          id?: string
          payeeId?: string
          payerId?: string
          paymentMethod?: Json
          platformFee?: number
          processedAt?: string | null
          status?: Database["public"]["Enums"]["PaymentStatus"]
          transactionId?: string | null
          vendorPayout?: number
        }
        Relationships: [
          {
            foreignKeyName: "PaymentRecord_booking_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "BookingRequest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PaymentRecord_payee_fkey"
            columns: ["payeeId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PaymentRecord_payer_fkey"
            columns: ["payerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Registration: {
        Row: {
          createdAt: string
          eventId: string
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["RegistrationStatus"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          eventId: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["RegistrationStatus"]
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          eventId?: string
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["RegistrationStatus"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Registration_event_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Registration_user_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Rubric: {
        Row: {
          createdAt: string
          criteria: Json
          eventId: string
          id: string
        }
        Insert: {
          createdAt?: string
          criteria: Json
          eventId: string
          id?: string
        }
        Update: {
          createdAt?: string
          criteria?: Json
          eventId?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Rubric_event_fkey"
            columns: ["eventId"]
            isOneToOne: true
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
        ]
      }
      Score: {
        Row: {
          id: string
          judgeId: string
          rubricId: string
          scores: Json
          submissionId: string
          submittedAt: string
        }
        Insert: {
          id?: string
          judgeId: string
          rubricId: string
          scores: Json
          submissionId: string
          submittedAt?: string
        }
        Update: {
          id?: string
          judgeId?: string
          rubricId?: string
          scores?: Json
          submissionId?: string
          submittedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Score_judge_fkey"
            columns: ["judgeId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Score_rubric_fkey"
            columns: ["rubricId"]
            isOneToOne: false
            referencedRelation: "Rubric"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Score_submission_fkey"
            columns: ["submissionId"]
            isOneToOne: false
            referencedRelation: "Submission"
            referencedColumns: ["id"]
          },
        ]
      }
      ServiceAgreement: {
        Row: {
          bookingId: string
          cancellationPolicy: string
          createdAt: string
          deliverables: Json
          id: string
          organizerSignature: string | null
          paymentSchedule: Json
          signedAt: string | null
          terms: string
          updatedAt: string
          vendorSignature: string | null
        }
        Insert: {
          bookingId: string
          cancellationPolicy: string
          createdAt?: string
          deliverables: Json
          id?: string
          organizerSignature?: string | null
          paymentSchedule: Json
          signedAt?: string | null
          terms: string
          updatedAt?: string
          vendorSignature?: string | null
        }
        Update: {
          bookingId?: string
          cancellationPolicy?: string
          createdAt?: string
          deliverables?: Json
          id?: string
          organizerSignature?: string | null
          paymentSchedule?: Json
          signedAt?: string | null
          terms?: string
          updatedAt?: string
          vendorSignature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ServiceAgreement_booking_fkey"
            columns: ["bookingId"]
            isOneToOne: true
            referencedRelation: "BookingRequest"
            referencedColumns: ["id"]
          },
        ]
      }
      ServiceListing: {
        Row: {
          availability: Json
          bookingCount: number
          category: Database["public"]["Enums"]["ServiceCategory"]
          createdAt: string
          description: string
          exclusions: string[]
          featured: boolean
          id: string
          inclusions: string[]
          inquiryCount: number
          media: Json
          pricing: Json
          requirements: string | null
          serviceArea: string[]
          status: string
          title: string
          updatedAt: string
          vendorId: string
          viewCount: number
        }
        Insert: {
          availability: Json
          bookingCount?: number
          category: Database["public"]["Enums"]["ServiceCategory"]
          createdAt?: string
          description: string
          exclusions: string[]
          featured?: boolean
          id?: string
          inclusions: string[]
          inquiryCount?: number
          media: Json
          pricing: Json
          requirements?: string | null
          serviceArea: string[]
          status?: string
          title: string
          updatedAt?: string
          vendorId: string
          viewCount?: number
        }
        Update: {
          availability?: Json
          bookingCount?: number
          category?: Database["public"]["Enums"]["ServiceCategory"]
          createdAt?: string
          description?: string
          exclusions?: string[]
          featured?: boolean
          id?: string
          inclusions?: string[]
          inquiryCount?: number
          media?: Json
          pricing?: Json
          requirements?: string | null
          serviceArea?: string[]
          status?: string
          title?: string
          updatedAt?: string
          vendorId?: string
          viewCount?: number
        }
        Relationships: [
          {
            foreignKeyName: "ServiceListing_vendor_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "VendorProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      Submission: {
        Row: {
          createdAt: string
          description: string | null
          eventId: string
          id: string
          metadata: Json | null
          rubricId: string
          teamName: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          eventId: string
          id?: string
          metadata?: Json | null
          rubricId: string
          teamName: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          eventId?: string
          id?: string
          metadata?: Json | null
          rubricId?: string
          teamName?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Submission_rubric_fkey"
            columns: ["rubricId"]
            isOneToOne: false
            referencedRelation: "Rubric"
            referencedColumns: ["id"]
          },
        ]
      }
      TeamMember: {
        Row: {
          id: string
          invitedBy: string
          joinedAt: string
          leftAt: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["WorkspaceRole"]
          status: Database["public"]["Enums"]["MemberStatus"]
          userId: string
          workspaceId: string
        }
        Insert: {
          id?: string
          invitedBy: string
          joinedAt?: string
          leftAt?: string | null
          permissions?: Json | null
          role: Database["public"]["Enums"]["WorkspaceRole"]
          status?: Database["public"]["Enums"]["MemberStatus"]
          userId: string
          workspaceId: string
        }
        Update: {
          id?: string
          invitedBy?: string
          joinedAt?: string
          leftAt?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["WorkspaceRole"]
          status?: Database["public"]["Enums"]["MemberStatus"]
          userId?: string
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeamMember_inviter_fkey"
            columns: ["invitedBy"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMember_user_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TeamMember_workspace_fkey"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          createdAt: string
          email: string
          emailVerified: boolean
          id: string
          name: string
          passwordHash: string
          role: Database["public"]["Enums"]["UserRole"]
          status: Database["public"]["Enums"]["UserStatus"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified?: boolean
          id?: string
          name: string
          passwordHash: string
          role: Database["public"]["Enums"]["UserRole"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: boolean
          id?: string
          name?: string
          passwordHash?: string
          role?: Database["public"]["Enums"]["UserRole"]
          status?: Database["public"]["Enums"]["UserStatus"]
          updatedAt?: string
        }
        Relationships: []
      }
      VendorProfile: {
        Row: {
          businessAddress: Json
          businessHours: Json | null
          businessName: string
          completionRate: number
          contactInfo: Json
          createdAt: string
          description: string
          id: string
          portfolio: Json
          rating: number
          rejectionReason: string | null
          responseTime: number
          reviewCount: number
          serviceCategories: Database["public"]["Enums"]["ServiceCategory"][]
          updatedAt: string
          userId: string
          verificationDocuments: Json | null
          verificationStatus: Database["public"]["Enums"]["VerificationStatus"]
        }
        Insert: {
          businessAddress: Json
          businessHours?: Json | null
          businessName: string
          completionRate?: number
          contactInfo: Json
          createdAt?: string
          description: string
          id?: string
          portfolio: Json
          rating?: number
          rejectionReason?: string | null
          responseTime?: number
          reviewCount?: number
          serviceCategories: Database["public"]["Enums"]["ServiceCategory"][]
          updatedAt?: string
          userId: string
          verificationDocuments?: Json | null
          verificationStatus?: Database["public"]["Enums"]["VerificationStatus"]
        }
        Update: {
          businessAddress?: Json
          businessHours?: Json | null
          businessName?: string
          completionRate?: number
          contactInfo?: Json
          createdAt?: string
          description?: string
          id?: string
          portfolio?: Json
          rating?: number
          rejectionReason?: string | null
          responseTime?: number
          reviewCount?: number
          serviceCategories?: Database["public"]["Enums"]["ServiceCategory"][]
          updatedAt?: string
          userId?: string
          verificationDocuments?: Json | null
          verificationStatus?: Database["public"]["Enums"]["VerificationStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "VendorProfile_user_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      VendorReview: {
        Row: {
          bookingId: string
          comment: string
          communication: number
          createdAt: string
          helpful: number
          id: string
          organizerId: string
          rating: number
          serviceQuality: number
          timeliness: number
          title: string
          updatedAt: string
          value: number
          vendorId: string
          vendorResponse: string | null
          vendorResponseAt: string | null
          verifiedPurchase: boolean
          wouldRecommend: boolean
        }
        Insert: {
          bookingId: string
          comment: string
          communication: number
          createdAt?: string
          helpful?: number
          id?: string
          organizerId: string
          rating: number
          serviceQuality: number
          timeliness: number
          title: string
          updatedAt?: string
          value: number
          vendorId: string
          vendorResponse?: string | null
          vendorResponseAt?: string | null
          verifiedPurchase?: boolean
          wouldRecommend: boolean
        }
        Update: {
          bookingId?: string
          comment?: string
          communication?: number
          createdAt?: string
          helpful?: number
          id?: string
          organizerId?: string
          rating?: number
          serviceQuality?: number
          timeliness?: number
          title?: string
          updatedAt?: string
          value?: number
          vendorId?: string
          vendorResponse?: string | null
          vendorResponseAt?: string | null
          verifiedPurchase?: boolean
          wouldRecommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "VendorReview_booking_fkey"
            columns: ["bookingId"]
            isOneToOne: true
            referencedRelation: "BookingRequest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "VendorReview_organizer_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "VendorReview_vendor_fkey"
            columns: ["vendorId"]
            isOneToOne: false
            referencedRelation: "VendorProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      Workspace: {
        Row: {
          createdAt: string
          description: string | null
          dissolvedAt: string | null
          eventId: string
          id: string
          name: string
          settings: Json | null
          status: Database["public"]["Enums"]["WorkspaceStatus"]
          templateId: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          dissolvedAt?: string | null
          eventId: string
          id?: string
          name: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["WorkspaceStatus"]
          templateId?: string | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          dissolvedAt?: string | null
          eventId?: string
          id?: string
          name?: string
          settings?: Json | null
          status?: Database["public"]["Enums"]["WorkspaceStatus"]
          templateId?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Workspace_event_fkey"
            columns: ["eventId"]
            isOneToOne: true
            referencedRelation: "Event"
            referencedColumns: ["id"]
          },
        ]
      }
      WorkspaceChannel: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          isPrivate: boolean
          members: string[]
          name: string
          type: Database["public"]["Enums"]["ChannelType"]
          updatedAt: string
          workspaceId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          isPrivate?: boolean
          members?: string[]
          name: string
          type: Database["public"]["Enums"]["ChannelType"]
          updatedAt?: string
          workspaceId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          isPrivate?: boolean
          members?: string[]
          name?: string
          type?: Database["public"]["Enums"]["ChannelType"]
          updatedAt?: string
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkspaceChannel_workspace_fkey"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["id"]
          },
        ]
      }
      WorkspaceMessage: {
        Row: {
          attachments: Json | null
          channelId: string
          content: string
          deletedAt: string | null
          editedAt: string | null
          id: string
          isPriority: boolean
          senderId: string
          sentAt: string
        }
        Insert: {
          attachments?: Json | null
          channelId: string
          content: string
          deletedAt?: string | null
          editedAt?: string | null
          id?: string
          isPriority?: boolean
          senderId: string
          sentAt?: string
        }
        Update: {
          attachments?: Json | null
          channelId?: string
          content?: string
          deletedAt?: string | null
          editedAt?: string | null
          id?: string
          isPriority?: boolean
          senderId?: string
          sentAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkspaceMessage_channel_fkey"
            columns: ["channelId"]
            isOneToOne: false
            referencedRelation: "WorkspaceChannel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkspaceMessage_sender_fkey"
            columns: ["senderId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      WorkspaceTask: {
        Row: {
          assigneeId: string | null
          category: Database["public"]["Enums"]["TaskCategory"]
          completedAt: string | null
          createdAt: string
          creatorId: string
          dependencies: Json | null
          description: string
          dueDate: string | null
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["TaskPriority"]
          progress: number
          status: Database["public"]["Enums"]["TaskStatus"]
          tags: string[]
          title: string
          updatedAt: string
          workspaceId: string
        }
        Insert: {
          assigneeId?: string | null
          category: Database["public"]["Enums"]["TaskCategory"]
          completedAt?: string | null
          createdAt?: string
          creatorId: string
          dependencies?: Json | null
          description: string
          dueDate?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["TaskPriority"]
          progress?: number
          status?: Database["public"]["Enums"]["TaskStatus"]
          tags?: string[]
          title: string
          updatedAt?: string
          workspaceId: string
        }
        Update: {
          assigneeId?: string | null
          category?: Database["public"]["Enums"]["TaskCategory"]
          completedAt?: string | null
          createdAt?: string
          creatorId?: string
          dependencies?: Json | null
          description?: string
          dueDate?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["TaskPriority"]
          progress?: number
          status?: Database["public"]["Enums"]["TaskStatus"]
          tags?: string[]
          title?: string
          updatedAt?: string
          workspaceId?: string
        }
        Relationships: [
          {
            foreignKeyName: "WorkspaceTask_assignee_fkey"
            columns: ["assigneeId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkspaceTask_creator_fkey"
            columns: ["creatorId"]
            isOneToOne: false
            referencedRelation: "TeamMember"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "WorkspaceTask_workspace_fkey"
            columns: ["workspaceId"]
            isOneToOne: false
            referencedRelation: "Workspace"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      BookingStatus:
        | "PENDING"
        | "VENDOR_REVIEWING"
        | "QUOTE_SENT"
        | "QUOTE_ACCEPTED"
        | "CONFIRMED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "DISPUTED"
      CertificateType: "MERIT" | "COMPLETION" | "APPRECIATION"
      ChannelType: "GENERAL" | "TASK_SPECIFIC" | "ROLE_BASED" | "ANNOUNCEMENT"
      EventMode: "OFFLINE" | "ONLINE" | "HYBRID"
      EventStatus: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED"
      EventVisibility: "PUBLIC" | "PRIVATE" | "UNLISTED"
      MemberStatus: "INVITED" | "ACTIVE" | "INACTIVE"
      OrganizationCategory: "COLLEGE" | "COMPANY" | "INDUSTRY" | "NON_PROFIT"
      PaymentMethodType: "CREDIT_CARD" | "BANK_TRANSFER" | "DIGITAL_WALLET"
      PaymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      PricingType: "FIXED" | "HOURLY" | "PER_PERSON" | "CUSTOM_QUOTE"
      RegistrationStatus: "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED"
      ServiceCategory:
        | "VENUE"
        | "CATERING"
        | "PHOTOGRAPHY"
        | "VIDEOGRAPHY"
        | "ENTERTAINMENT"
        | "DECORATION"
        | "AUDIO_VISUAL"
        | "TRANSPORTATION"
        | "SECURITY"
        | "CLEANING"
        | "EQUIPMENT_RENTAL"
        | "PRINTING"
        | "MARKETING"
        | "OTHER"
      TaskCategory:
        | "SETUP"
        | "MARKETING"
        | "LOGISTICS"
        | "TECHNICAL"
        | "REGISTRATION"
        | "POST_EVENT"
      TaskPriority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      TaskStatus:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "REVIEW_REQUIRED"
        | "COMPLETED"
        | "BLOCKED"
      UserRole:
        | "SUPER_ADMIN"
        | "ORGANIZER"
        | "PARTICIPANT"
        | "JUDGE"
        | "VOLUNTEER"
        | "SPEAKER"
      UserStatus: "PENDING" | "ACTIVE" | "SUSPENDED"
      VerificationStatus: "PENDING" | "VERIFIED" | "REJECTED"
      WorkspaceRole:
        | "WORKSPACE_OWNER"
        | "TEAM_LEAD"
        | "EVENT_COORDINATOR"
        | "VOLUNTEER_MANAGER"
        | "TECHNICAL_SPECIALIST"
        | "MARKETING_LEAD"
        | "GENERAL_VOLUNTEER"
      WorkspaceStatus: "PROVISIONING" | "ACTIVE" | "WINDING_DOWN" | "DISSOLVED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      BookingStatus: [
        "PENDING",
        "VENDOR_REVIEWING",
        "QUOTE_SENT",
        "QUOTE_ACCEPTED",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
      ],
      CertificateType: ["MERIT", "COMPLETION", "APPRECIATION"],
      ChannelType: ["GENERAL", "TASK_SPECIFIC", "ROLE_BASED", "ANNOUNCEMENT"],
      EventMode: ["OFFLINE", "ONLINE", "HYBRID"],
      EventStatus: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"],
      EventVisibility: ["PUBLIC", "PRIVATE", "UNLISTED"],
      MemberStatus: ["INVITED", "ACTIVE", "INACTIVE"],
      OrganizationCategory: ["COLLEGE", "COMPANY", "INDUSTRY", "NON_PROFIT"],
      PaymentMethodType: ["CREDIT_CARD", "BANK_TRANSFER", "DIGITAL_WALLET"],
      PaymentStatus: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      PricingType: ["FIXED", "HOURLY", "PER_PERSON", "CUSTOM_QUOTE"],
      RegistrationStatus: ["PENDING", "CONFIRMED", "WAITLISTED", "CANCELLED"],
      ServiceCategory: [
        "VENUE",
        "CATERING",
        "PHOTOGRAPHY",
        "VIDEOGRAPHY",
        "ENTERTAINMENT",
        "DECORATION",
        "AUDIO_VISUAL",
        "TRANSPORTATION",
        "SECURITY",
        "CLEANING",
        "EQUIPMENT_RENTAL",
        "PRINTING",
        "MARKETING",
        "OTHER",
      ],
      TaskCategory: [
        "SETUP",
        "MARKETING",
        "LOGISTICS",
        "TECHNICAL",
        "REGISTRATION",
        "POST_EVENT",
      ],
      TaskPriority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      TaskStatus: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "REVIEW_REQUIRED",
        "COMPLETED",
        "BLOCKED",
      ],
      UserRole: [
        "SUPER_ADMIN",
        "ORGANIZER",
        "PARTICIPANT",
        "JUDGE",
        "VOLUNTEER",
        "SPEAKER",
      ],
      UserStatus: ["PENDING", "ACTIVE", "SUSPENDED"],
      VerificationStatus: ["PENDING", "VERIFIED", "REJECTED"],
      WorkspaceRole: [
        "WORKSPACE_OWNER",
        "TEAM_LEAD",
        "EVENT_COORDINATOR",
        "VOLUNTEER_MANAGER",
        "TECHNICAL_SPECIALIST",
        "MARKETING_LEAD",
        "GENERAL_VOLUNTEER",
      ],
      WorkspaceStatus: ["PROVISIONING", "ACTIVE", "WINDING_DOWN", "DISSOLVED"],
    },
  },
} as const
