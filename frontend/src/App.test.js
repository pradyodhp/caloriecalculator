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
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Restaurant,
  Favorite,
  Warning,
  LocalDining,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';
import './App.css';

function App() {
  const [foodInput, setFoodInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

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
      setError('Food not found. Try: samosa, idli, pizza, dal, etc.');
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#4caf50';
    if (score >= 6) return '#ff9800';
    return '#f44336';
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
          Get detailed nutritional analysis and healthier alternatives for Indian foods
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
                  <Chip label={results.food.servingSize || 'Standard portion'} color="primary" size="small" />
                  <Chip label={results.food.foodType} variant="outlined" size="small" />
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h3" sx={{ color: getScoreColor(parseInt(results.healthIndex.score)) }}>
                    {results.healthIndex.score}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Health Score
                  </Typography>
                  <Chip 
                    label={results.healthIndex.rating} 
                    color={results.healthIndex.score >= 7 ? 'success' : results.healthIndex.score >= 5 ? 'warning' : 'error'}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Nutrition Facts" />
              <Tab label="Health Analysis" />
              <Tab label="Alternatives" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                {Object.entries(results.food.nutrients).map(([key, value]) => (
                  <Grid item xs={6} sm={4} md={2} key={key}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {results.healthIndex.description}
                </Typography>
                
                {results.longTermHealth.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        <Warning sx={{ verticalAlign: 'bottom', mr: 1 }} />
                        Long-term Concerns
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {results.longTermHealth.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </Box>
                  </Alert>
                )}

                {results.longTermHealth.benefits.length > 0 && (
                  <Alert severity="success">
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        <Favorite sx={{ verticalAlign: 'bottom', mr: 1 }} />
                        Health Benefits
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {results.longTermHealth.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </Box>
                  </Alert>
                )}

                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    borderRadius: 1,
                    bgcolor: results.overallRecommendation.includes('EXCELLENT') ? 
                      '#e8f5e8' : results.overallRecommendation.includes('MODERATE') ? 
                      '#fff3e0' : '#ffebee'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    <TrendingUp sx={{ verticalAlign: 'bottom', mr: 1 }} />
                    Recommendation
                  </Typography>
                  <Typography variant="body1">
                    {results.overallRecommendation}
                  </Typography>
                </Box>
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <LocalDining sx={{ verticalAlign: 'bottom', mr: 1 }} />
                  Healthier Alternatives
                </Typography>
                <Grid container spacing={2}>
                  {results.alternatives.map((alternative, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            {alternative.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {alternative.benefit}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
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