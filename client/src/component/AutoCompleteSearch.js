import React, { useState, useCallback } from 'react';
import { AutoComplete, Card, Button, Space } from 'antd';
import axios from 'axios';

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};
const SearchAutocomplete = ({ placeholder = "Type something...", width = 300, setCoordinate }) => {
  const [options, setOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const fetchCoordinates = async (address) => {
    try {
      const response = await axios.get("http://localhost:3001/Map/get", {
        params: { address },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching data:",
        error.response?.data || error.message
      );
    }
  };
  const handleSearch = useCallback(
    debounce(async (value) => {
      if (!value) {
        setOptions([]);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/Map/autoComplete?input=${value}`);
        setOptions(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setOptions([]);
      }
    }, 600),
    []
  );

  const handleSearchButton =async () => {
    if (!searchValue) return;
    const coor=await fetchCoordinates(searchValue);
    
    setCoordinate(coor[0]);
  };
  const handleSelect=async (value)=>{
    const coor=await fetchCoordinates(value);
    setCoordinate(coor[0]);
  }
  return (
    <Space.Compact style={{ width }}>
      <AutoComplete
        style={{ width: '80%' }}
        options={options.map((option) => ({
          key:option.id,
          value: option.description,
          label: (
            <div key={option.id} size="small" style={{ width: '100%', margin: '5px 0' }}>
              <div className="font-bold">{option.main_text}</div>
              <div className="text-gray-500">{option.secondary_text}</div>
            </div>
          ),
          coor: option.coor,
        }))}
        onSelect={value=>handleSelect(value)}
        onSearch={handleSearch}
        onChange={(value) => setSearchValue(value)}
        placeholder={placeholder}
      />
      <Button onClick={handleSearchButton} className="bg-none">
        <img
          src="https://i.imgur.com/MdNd6W3.png"
          className="w-5 h-5"
          alt="Search"
        />
      </Button>
    </Space.Compact>
  );
};

export default SearchAutocomplete;
