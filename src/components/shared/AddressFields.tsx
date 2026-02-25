import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

interface AddressFieldsProps {
  prefix?: string;
  defaults?: Record<string, string>;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AddressFields({ prefix = '', defaults = {}, disabled = false, onChange }: AddressFieldsProps) {
  const name = (field: string) => prefix ? `${prefix}.${field}` : field;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth label="Rua" name={name('street')} required
          defaultValue={defaults.street} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="Número" name={name('number')} required
          defaultValue={defaults.number} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="Complemento" name={name('complement')}
          defaultValue={defaults.complement} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="Cidade" name={name('city')} required
          defaultValue={defaults.city} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="Estado" name={name('state')} required
          defaultValue={defaults.state} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="País" name={name('country')} required
          defaultValue={defaults.country || 'Brasil'} disabled={disabled} onChange={onChange}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth label="CEP" name={name('zipCode')} required
          defaultValue={defaults.zipCode} disabled={disabled} onChange={onChange}
        />
      </Grid>
    </Grid>
  );
}
