import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Contract } from '../types';
import { ContractModal } from './modals/ContractModal';
import { DeleteConfirmationModal } from './modals/DeleteConfirmationModal';

interface ContractManagementProps {
  contracts: Contract[];
  onStatusUpdate: (contractId: string, status: Contract['status']) => void;
  onDelete: (contractId: string) => void;
}

export function ContractManagement({ contracts, onStatusUpdate, onDelete }: ContractManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (contractToDelete) {
      onDelete(contractToDelete.id);
      setContractToDelete(null);
    }
  };

  const filteredContracts = contracts.filter(contract =>
    contract.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.buyer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Gestão de Contratos</Typography>

      <TextField
        fullWidth
        placeholder="Pesquisar por vendedor ou comprador..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            ),
          },
        }}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendedor</TableCell>
                <TableCell>Comprador</TableCell>
                <TableCell>Quantidade</TableCell>
                <TableCell>Data de Entrega</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>Nenhum contrato encontrado</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{contract.seller.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{contract.buyer.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{contract.quantity} sacas</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{new Date(contract.date).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" variant="outlined"
                        value={contract.status}
                        onChange={(e) => onStatusUpdate(contract.id, e.target.value as Contract['status'])}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="active">Em Progresso</MenuItem>
                        <MenuItem value="completed">Concluído</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalhes">
                        <IconButton size="small" onClick={() => handleView(contract)} color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(contract)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleDelete(contract)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedContract && (
        <ContractModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contract={selectedContract}
          mode={modalMode}
          onStatusUpdate={onStatusUpdate}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setContractToDelete(null); }}
        onConfirm={confirmDelete}
        clientName={`contrato entre ${contractToDelete?.seller.name} e ${contractToDelete?.buyer.name}`}
      />
    </Box>
  );
}
