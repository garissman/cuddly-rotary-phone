import React, { useEffect, useReducer } from 'react'
import { StyleSheet, Text, View, Button, TextInput } from 'react-native';
import API, { graphqlOperation } from '@aws-amplify/api'
import PubSub from '@aws-amplify/pubsub';
import { createTodo } from './src/graphql/mutations';

import config from './aws-exports'
// other imports
import { listTodos } from './src/graphql/queries';
import { onCreateTodo } from './src/graphql/subscriptions';

const initialState = { todos: [] };
const reducer = ( state, action ) =>
{
  switch ( action.type )
  {
    case 'QUERY':
      return { ...state, todos: action.todos }
    case 'SUBSCRIPTION':
      return { ...state, todos: [ ...state.todos, action.todo ] }
    default:
      return state
  }
}
API.configure( config )             // Configure Amplify
PubSub.configure( config )

async function createNewTodo ( todo )
{
  await API.graphql( graphqlOperation( createTodo, { input: todo } ) )
}

export default function App ()
{
  const [ state, dispatch ] = useReducer( reducer, initialState )
  const [ imputName, setimputName ] = React.useState( '' );
  const [ imputDescription, setimputDescription ] = React.useState( '' );
  const reset = () =>
  {
    setimputName( '' );
    setimputDescription( '' );
  }
  useEffect( () =>
  {
    getData()
    const subscription = API.graphql( graphqlOperation( onCreateTodo ) ).subscribe( {
      next: ( eventData ) =>
      {
        const todo = eventData.value.data.onCreateTodo;
        dispatch( { type: 'SUBSCRIPTION', todo } )
      }
    } )
    return () => subscription.unsubscribe()
  }, [] )

  async function getData ()
  {
    const todoData = await API.graphql( graphqlOperation( listTodos ) )
    dispatch( { type: 'QUERY', todos: todoData.data.listTodos.items } );
  }
  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={( text ) => setimputName( text )}
        placeholder="Name"
        defaultValue={imputName}
      />
      <TextInput
        onChangeText={( text ) => setimputDescription( text )}
        placeholder="Description"
        defaultValue={imputDescription}
      />
      <Button onPress={() => { createNewTodo( { name: imputName, description: imputDescription } ).then( () => { reset(); } ); }} title='Create Todo' />
      {state.todos.map( ( todo, i ) => <Text key={todo.id}>{todo.name} : {todo.description}</Text> )}
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    backgroundColor: '#ddeeff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  }
} );
