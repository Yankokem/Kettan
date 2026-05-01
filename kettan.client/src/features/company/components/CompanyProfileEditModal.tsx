import { useEffect, useState } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import { Button } from '../../../components/UI/Button';
import { TextField } from '../../../components/UI/TextField';
import type { CompanyProfileFormData, CompanyProfileFormErrors } from '../types';

interface CompanyProfileEditModalProps {
  open: boolean;
  formData: CompanyProfileFormData;
  onClose: () => void;
  onSave: (nextData: CompanyProfileFormData) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(url: string): boolean {
  if (!url.trim()) {
    return true;
  }

  try {
    const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

export function CompanyProfileEditModal({ open, formData, onClose, onSave }: CompanyProfileEditModalProps) {
  const [draft, setDraft] = useState<CompanyProfileFormData>(formData);
  const [errors, setErrors] = useState<CompanyProfileFormErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(formData);
    setErrors({});
  }, [formData, open]);

  const updateField = <K extends keyof CompanyProfileFormData>(field: K, value: CompanyProfileFormData[K]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: CompanyProfileFormErrors = {};

    if (!draft.name.trim()) {
      nextErrors.name = 'Organization name is required.';
    }

    if (!draft.legalName.trim()) {
      nextErrors.legalName = 'Legal business name is required.';
    }

    if (!draft.headquartersCity.trim()) {
      nextErrors.headquartersCity = 'Headquarters city is required.';
    }

    if (!draft.headquartersAddress.trim()) {
      nextErrors.headquartersAddress = 'Headquarters address is required.';
    }

    if (!draft.billingEmail.trim()) {
      nextErrors.billingEmail = 'Billing email is required.';
    } else if (!emailRegex.test(draft.billingEmail.trim())) {
      nextErrors.billingEmail = 'Enter a valid billing email.';
    }

    if (!draft.supportEmail.trim()) {
      nextErrors.supportEmail = 'Support email is required.';
    } else if (!emailRegex.test(draft.supportEmail.trim())) {
      nextErrors.supportEmail = 'Enter a valid support email.';
    }

    if (!draft.phoneContact.trim()) {
      nextErrors.phoneContact = 'Phone contact is required.';
    }

    if (!isValidUrl(draft.website)) {
      nextErrors.website = 'Enter a valid website URL.';
    }

    if (!draft.taxId.trim()) {
      nextErrors.taxId = 'Tax ID is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      legalName: draft.legalName.trim(),
      headquartersCity: draft.headquartersCity.trim(),
      headquartersAddress: draft.headquartersAddress.trim(),
      billingEmail: draft.billingEmail.trim(),
      supportEmail: draft.supportEmail.trim(),
      phoneContact: draft.phoneContact.trim(),
      website: draft.website.trim(),
      taxId: draft.taxId.trim(),
    });
  };

  const renderError = (value?: string) =>
    value ? (
      <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.75, ml: 0.5 }}>{value}</Typography>
    ) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Edit Company Profile</DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2.5, md: 3 }, py: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, color: '#6B4C2A' }}>
          <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Organization Identity</Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Organization Name</Typography>
            <TextField
              value={draft.name}
              placeholder="e.g. Philippine Roasters Corp."
              onChange={(event) => updateField('name', event.target.value)}
            />
            {renderError(errors.name)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Legal Name</Typography>
            <TextField
              value={draft.legalName}
              placeholder="Legal registered company name"
              onChange={(event) => updateField('legalName', event.target.value)}
            />
            {renderError(errors.legalName)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Tax ID</Typography>
            <TextField
              value={draft.taxId}
              placeholder="e.g. 000-123-456-000"
              onChange={(event) => updateField('taxId', event.target.value)}
            />
            {renderError(errors.taxId)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Website</Typography>
            <TextField
              value={draft.website}
              placeholder="e.g. kettan.coffee"
              onChange={(event) => updateField('website', event.target.value)}
            />
            {renderError(errors.website)}
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3.2, mb: 2.5, color: '#6B4C2A' }}>
          <Box sx={{ width: 3, height: 20, borderRadius: 999, bgcolor: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Contact and Location</Typography>
        </Box>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Billing Email</Typography>
            <TextField
              value={draft.billingEmail}
              placeholder="finance@company.com"
              onChange={(event) => updateField('billingEmail', event.target.value)}
            />
            {renderError(errors.billingEmail)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Support Email</Typography>
            <TextField
              value={draft.supportEmail}
              placeholder="support@company.com"
              onChange={(event) => updateField('supportEmail', event.target.value)}
            />
            {renderError(errors.supportEmail)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Phone Contact</Typography>
            <TextField
              value={draft.phoneContact}
              placeholder="+63"
              onChange={(event) => updateField('phoneContact', event.target.value)}
            />
            {renderError(errors.phoneContact)}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Headquarters City</Typography>
            <TextField
              value={draft.headquartersCity}
              placeholder="e.g. Makati City"
              onChange={(event) => updateField('headquartersCity', event.target.value)}
            />
            {renderError(errors.headquartersCity)}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: 'text.primary', mb: 0.8 }}>Headquarters Address</Typography>
            <TextField
              multiline
              rows={2}
              value={draft.headquartersAddress}
              placeholder="Full address"
              onChange={(event) => updateField('headquartersAddress', event.target.value)}
            />
            {renderError(errors.headquartersAddress)}
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <BusinessRoundedIcon sx={{ fontSize: 17, color: '#6B4C2A' }} />
          <Typography sx={{ fontSize: 12.5, color: '#6B4C2A', fontWeight: 600 }}>
            Updates affect invoices, support communications, and company-facing reports.
          </Typography>
          <LocationOnRoundedIcon sx={{ fontSize: 16, color: '#8C6B43', ml: { xs: 0, sm: 'auto' } }} />
          <AlternateEmailRoundedIcon sx={{ fontSize: 16, color: '#8C6B43' }} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button startIcon={<SaveRoundedIcon sx={{ fontSize: 18 }} />} onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
