import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import axios from 'axios';
import './App.css';

function App() {
  const [foodInput, setFoodInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const API_BASE_URL = 'http://localhost:3001';

  const searchFood = async () => {
    if (!foodInput.trim()) {
      setError('Please enter a food name');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/nutrition/${encodeURIComponent(foodInput)}`);
      setResults(response.data);
    } catch (err) {
      setError('Food not found, or the data provider is unavailable.');
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchFood();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ 
          color: '#2e7d32', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <Restaurant fontSize="large" />
          Nutrition Advisor
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Look up nutrition data for foods, with the source shown
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            label="Enter food name (e.g., samosa, pizza, dal, idli)"
            variant="outlined"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button
            variant="contained"
            size="large"
            onClick={searchFood}
            disabled={loading}
            sx={{ 
              minWidth: 120,
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#388e3c' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {results && (
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom>
                  {results.food.description}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip label={results.food.source} variant="outlined" size="small" />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Values {results.food.basis}. Source: {results.food.source} (ID {results.food.sourceId}).
              General nutrition information, not medical advice.
            </Typography>
            <Grid container spacing={3}>
              {results.food.nutrients.map((n) => (
                <Grid item xs={6} sm={4} md={3} key={n.key}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary">{n.value} {n.unit}</Typography>
                      <Typography variant="body2" color="text.secondary">{n.key}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      )}

      <Box textAlign="center">
        <Typography variant="h6" gutterBottom color="text.secondary">
          Try these foods:
        </Typography>
        <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
          {['samosa', 'idli', 'pizza', 'dal', 'paneer', 'burger'].map((food) => (
            <Chip
              key={food}
              label={food}
              onClick={() => {
                setFoodInput(food);
                setTimeout(searchFood, 100);
              }}
              variant="outlined"
              clickable
            />
          ))}
        </Box>
      </Box>
    </Container>
  );
}

export default App;