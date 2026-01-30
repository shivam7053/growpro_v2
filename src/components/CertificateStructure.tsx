// d:/r1/growpro_v2/src/components/CertificateStructure.tsx
import { UserCertificate } from '@/types/masterclass';

/**
 * @description Defines the data structure passed to the certificate generation function.
 * It uses properties from the `UserCertificate` type and adds asset paths.
 */
export interface CertificateData extends Pick<
  UserCertificate,
  'userName' | 'masterclassTitle' | 'speakerName' | 'masterclassThumbnailUrl'
> {
  certificateId: string; // The unique ID from UserCertificate.id
  issuedDate: string; // A formatted date string, e.g., "January 29, 2026"
}